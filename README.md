# tinytapeout_gds_viewer

you can use https://github.com/mbalestrini/GDS2glTF to generate the gtTF file from a GDS file (right now tested and built for SKY130 pdk and small designs)

## Local development

You need nodejs 16 or higher installed. Get it from https://nodejs.org/en/download/.

Run `npm install` to install dependencies.

Finally, run `npm start` to start the development server. Go to http://localhost:5173 to see the app.

## Deployment

Run `npm run build` to build the app for production. The build artifacts will be stored in the `dist/` directory.
