import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

var informationDiv = document.querySelector("div#information");

var fillerCellsVisible = true;
var topCellGeometryVisible = true;

// We can't load HTTP resources anyway, so let's just assume HTTPS
function toHttps(url) {
    if (typeof url != 'string') {
        return url;
    }
    return url.replace(/^http:\/\//i, 'https://');
}

const urlParams = new URLSearchParams(location.search);
const GLTF_URL = toHttps(urlParams.get('model')) || 'tinytapeout.gds.gltf';

const scene = new THREE.Scene();

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);

console.log(camera);
camera.position.x = 50;
camera.position.y = 130;
camera.position.z = -50;
camera.up.x = 0;
camera.up.y = 0;
camera.up.z = -1;

const renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color(0x202020);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambient_light = new THREE.AmbientLight(0x808080); // soft white light
scene.add(ambient_light);


RectAreaLightUniformsLib.init();

const width = 1000;
const height = 1000;
const intensity = 0.8;

const rectLight1 = new THREE.RectAreaLight(0xffffA0, intensity, width, height);
rectLight1.position.set(200, 400, -200);
rectLight1.lookAt(200, 0, -200);
scene.add(rectLight1)

const rectLight2 = new THREE.RectAreaLight(0xA0A0ff, intensity, width, height);
rectLight2.position.set(0, 400, 0);
rectLight2.lookAt(200, 0, -200);
scene.add(rectLight2)



var controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(50, 0, -50);
controls.update();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

window.onresize = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

animate();



// const loader = new FontLoader();
// var mainFont = null;
// loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
//     mainFont = font;
// });

const gui = new GUI();
const guiViewSettings = gui.addFolder("View Settings");
guiViewSettings.open();
const guiStatsFolder = gui.addFolder("Stats");
guiStatsFolder.close();

gui.domElement.onmouseup = function (event) {
    // Don't propagate to window
    event.stopPropagation();
};

let viewSettings = {
    "Control type": "Orbit",
    "Toggle filler cells": function () {
        fillerCellsVisible = !fillerCellsVisible;
        setFillerCellsVisibility(fillerCellsVisible);
    },
    "Toggle top cell geometry": function () {
        topCellGeometryVisible = !topCellGeometryVisible;
        setTopCellGeometryVisibility(topCellGeometryVisible);
    },
    "Orbit selected cell": orbitSelectedCell,
    "materials": [],
    "materials_visibility": []
};

guiViewSettings.add(viewSettings, "Control type", {
    Arcball: () => new ArcballControls(camera, renderer.domElement, scene),
    "Arcball (no gizmo)": () => new ArcballControls(camera, renderer.domElement),
    Map: () => {
        let control = new MapControls(camera, renderer.domElement)
        control.screenSpacePanning = true;
        return control;
    },
    Orbit: () => new OrbitControls(camera, renderer.domElement),
}).onChange( value => {
    controls.dispose();

    // get the direction of the camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    controls = value();

    // point the target from the camera in the
    // target direction
    camera.up.x = 0;
    camera.up.y = 0;
    camera.up.z = -1;
    camera.getWorldPosition(controls.target);
    controls.target.addScaledVector(direction, 50);

    controls.update();
});
guiViewSettings.add(viewSettings, "Toggle filler cells");
guiViewSettings.add(viewSettings, "Toggle top cell geometry");
guiViewSettings.add(viewSettings, "Orbit selected cell");


const gltf_loader = new GLTFLoader();
gltf_loader.load(
    GLTF_URL,
    // called when the resource is loaded
    function (gltf) {

        scene.add(gltf.scene);

        gltf.scene.rotation.x = -Math.PI / 2;
        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object

        let cell_stats = [];
        for (var i = 0; i < scene.children.length; i++) {
            for (var j = 0; j < scene.children[i].children.length; j++) {
                for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                    var node = scene.children[i].children[j].children[k];
                    if (node instanceof THREE.Object3D) {
                        // console.log(node.userData["type"]);
                        const cell_type = node.userData["type"];

                        if(cell_type==undefined) {
                            continue;
                        }
                        if (cell_stats[cell_type] == undefined) {
                            cell_stats[cell_type] = 0;
                        }
                        cell_stats[cell_type]++;
                    }

                }

            }

            // console.log(viewSettings.materials);
            // console.log(viewSettings.materials_visibility);
        }

        // showCell = function(c) {

        // };

        var cell_stats_actions = {};

        for (var cell_name in cell_stats) {
            // guiStatsFolder.add(cell_stats, cell_name);
            // console.log(cell_name);
            let c = cell_name;
            // cell_stats_actions[c] = function() {
            //     console.log(c);
            // };

            // let folder = guiStatsFolder.addFolder(cell_name);
            // folder.add(cell_stats_actions, c);
            let controller = guiStatsFolder.add(cell_stats, cell_name);
            controller.domElement.onmouseover = function (event) {
                event.stopPropagation();
                actionHighlightCellType(c);
            }
            controller.domElement.onmouseout = function (event) {
                turnOffHighlight();
            }

        }


        scene.traverse(function (object) {
            if (object.material) {
                if (viewSettings.materials[object.material.name] == undefined) {
                    viewSettings.materials[object.material.name] = object.material;
                    viewSettings.materials_visibility[object.material.name] = true;
                    // console.log(object.material.name);
                    guiViewSettings.add(viewSettings.materials_visibility, object.material.name).onChange(function (new_value) {
                        viewSettings.materials[this._name].visible = new_value;// viewSettings.materials_visibility[node.material.name];
                    });
                }
            }
        })

        // TEXT TEST
        // const geometry = new TextGeometry('TinyTapeout', {
        //     font: mainFont,
        //     size: 1.2,
        //     height: 0.1,
        //     curveSegments: 12,
        //     bevelEnabled: false,
        //     bevelThickness: 0.1,
        //     bevelSize: 0.1,
        //     bevelOffset: 0,
        //     bevelSegments: 5
        // });
        // const textMesh = new THREE.Mesh(geometry);
        // textMesh.rotation.x = -Math.PI / 2;
        // scene.children[0].add(textMesh);

    },
    // called while loading is progressing
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) {
        console.log('An error happened');
    }
);


const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x50f050 });
highlightMaterial.name = "HIGHLIGHT";
var previousMaterials = null;
var highlightedObjects = null;

var cellDetailMode = false;

window.onmousedown = function (event) {
    // if (event.buttons != 0 || cellDetailMode)
        // return;
    if (cellDetailMode)
        return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObject(scene, true);

    turnOffHighlight();


    if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
            var object = intersects[i].object;
            if (object.parent.parent.name != "" && object.parent.visible) {
                informationDiv.innerHTML = ("Mouse over: " + object.parent.name + " (" + object.parent.userData["type"] + ")");


                if (highlightedObjects == null) {
                    highlightedObjects = [];
                    previousMaterials = [];
                }

                let node = object.parent;

                for (var mesh_idx = 0; mesh_idx < node.children.length; mesh_idx++) {
                    let obj = node.children[mesh_idx];
                    if(obj instanceof THREE.Mesh) {

                        if (highlightedObjects.indexOf(obj) == -1) {
                            previousMaterials.push(obj.material);
                            highlightedObjects.push(obj);
                            obj.material = highlightMaterial;


                        }
                    }
                }


                // Found something to highlight, stop highlighting other
                // objects to avoid confusion (e.g. button 3 and 4 only acts on
                // the first hit)
                break;
            }
            // object.material.color.set(Math.random() * 0xffffff);
        }
    }
}

function turnOffHighlight() {
    if (highlightedObjects != null) {
        for (var i = 0; i < highlightedObjects.length; i++) {
            // console.log(highlightedObjects[i]);
            highlightedObjects[i].material = previousMaterials[i];
            // highlightedObjects[i].visible = false;// = null;
        }
        highlightedObjects = null;
        previousMaterials = null;
    }
}

function setFillerCellsVisibility(visible) {
    for (var i = 0; i < scene.children.length; i++) {
        for (var j = 0; j < scene.children[i].children.length; j++) {
            for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                var node = scene.children[i].children[j].children[k];
                if (node.userData["type"] != undefined) {
                    if (node.userData["type"].indexOf("fill") != -1
                        ||
                        node.userData["type"].indexOf("decap") != -1
                        ||
                        node.userData["type"].indexOf("tap") != -1
                    ) {
                        node.visible = visible;
                    }
                }
            }
        }
    }
}

function setTopCellGeometryVisibility(visible) {
    for (var i = 0; i < scene.children.length; i++) {
        for (var j = 0; j < scene.children[i].children.length; j++) {
            for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                var node = scene.children[i].children[j].children[k];
                if (node instanceof THREE.Mesh) {
                    // console.log(node);
                    if (node.material.name != "substrate")
                        node.visible = visible;
                }
            }
        }
    }
}

function orbitSelectedCell() {
    if (!cellDetailMode && highlightedObjects != null) {
        const bbox = new THREE.Box3().setFromObject(highlightedObjects[0].parent);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        controls.target.set(center.x, center.y, center.z);
        controls.update();
    }
}

function actionHighlightCellType(cell_type) {
    turnOffHighlight();

    if (highlightedObjects == null) {
        highlightedObjects = [];
        previousMaterials = [];
    }

    for (var i = 0; i < scene.children.length; i++) {
        for (var j = 0; j < scene.children[i].children.length; j++) {
            for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                let node = scene.children[i].children[j].children[k];
                if (node.userData["type"] != undefined && node.userData["type"] == cell_type) {
                    //node.visible = !node.visible;

                    for (var mesh_idx = 0; mesh_idx < node.children.length; mesh_idx++) {
                        let obj = node.children[mesh_idx];
                        if(obj instanceof THREE.Mesh) {

                            if (highlightedObjects.indexOf(obj) == -1) {
                                previousMaterials.push(obj.material);
                                highlightedObjects.push(obj);
                                obj.material = highlightMaterial;


                            }
                        }
                    }

                }
            }
        }
    }

}


window.onkeypress = function (event) {
    // console.log(event.key);
    if (event.key == "1") {
        fillerCellsVisible = !fillerCellsVisible;
        setFillerCellsVisibility(fillerCellsVisible);
    } else if (event.key == "2") {
        topCellGeometryVisible = !topCellGeometryVisible;
        setTopCellGeometryVisibility(topCellGeometryVisible);
    } else if (event.key == "3") {
        if (!cellDetailMode && highlightedObjects != null) {
            cellDetailMode = true;
            // console.log(highlightedObject.parent);
            for (var i = 0; i < scene.children.length; i++) {
                for (var j = 0; j < scene.children[i].children.length; j++) {
                    for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                        var node = scene.children[i].children[j].children[k];
                        if (node instanceof THREE.Object3D && node != highlightedObjects[0].parent) {
                            node.visible = false;
                        }
                    }
                }
            }



            controls.saveState();

            var viewCenter =  new THREE.Vector3;
            const bbox = new THREE.BoxHelper( highlightedObjects[0].parent, 0xffff00 );
            bbox.geometry.computeBoundingBox();
            bbox.geometry.boundingBox.getCenter(viewCenter);
            //scene.add(box);
            turnOffHighlight();

            camera.position.x = viewCenter.x;
            camera.position.y = 20;;
            camera.position.z = viewCenter.z;

            camera.up.x = 0;
            camera.up.y = 0;
            camera.up.z = -1;
            controls.target.set(viewCenter.x, 0, viewCenter.z);
            controls.update();

        } else {
            cellDetailMode = false;

            for (var i = 0; i < scene.children.length; i++) {
                for (var j = 0; j < scene.children[i].children.length; j++) {
                    for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                        var node = scene.children[i].children[j].children[k];
                        if (node instanceof THREE.Object3D) {
                            node.visible = true;
                        }
                    }
                }
            }
            // Restore hidden filler/top cells
            setFillerCellsVisibility(fillerCellsVisible);
            setTopCellGeometryVisibility(topCellGeometryVisible);
            controls.reset();
            controls.update();
        }
    } else if (event.key == "4") {
        orbitSelectedCell()
    }
};
