# DST Embroidery File Loader for THREE.JS

**Author:** thrax  
**Date:** January 15, 2024  
**Live Demo:** https://manthrax.github.io/dst-format/index.html
## Overview

This library provides a loader, parser, and renderer for the `.dst` embroidery machine file format, specifically designed for use with THREE.JS. It allows for rendering stitches to textured geometry, with an option to render to a rendertarget for more efficient display.

## Features

- **Dynamic Rendering:** Change colors, geometry, and thread parameters on the fly.
- **Normalized Draw Range:** Supports displaying stitches at different stages in the process.
- **Customizable Options:** The loader accepts an options parameter to customize the output.

## Options

- `quads`: Boolean (`true` or `false`). Determines whether to generate quads or line primitives. Default: `false`.
- `threadThickness`: Numeric value (0 to Infinity). Sets the thickness of the thread. Default: 2.
- `jumpThreadThickness`: Numeric value (0 to Infinity). Sets the thickness of the jump thread. Default: 0.01.
- `palette`: Array of color strings. Defines the colors used for the thread color steps. Ideally, should have one more color than the number of thread color steps in the file. Missing entries will be set to random colors.

## Return Object

The `load` method returns an object containing:

- `mesh`: The Mesh or Line primitive.
- All parameters specified in "options" can be modified dynamically.

## Usage
    import DSTLoader from "./DSTLoader.js"
    let texLoader = new THREE.TextureLoader();
    texLoader.load(
    "./assets/threadNormal.png",   //Load the normalmap for the thread texture
    (normalMap) => {
        new THREE.TextureLoader().load(
        "./assets/threadTexture.jpg", // Load the thread texture for rendering
        (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
            normalMap.colorSpace = THREE.LinearSRGBColorSpace; //Set some GL gorp on the textures to make em work..
    
            dstLoader.load(
                url,  // URL to the .dst file to load
                (lines) => {
                scene.add(lines.mesh);  //Add it's .mesh to your scene
                lines.mesh.material.map = tex; //Set its texture and normalmap
                lines.mesh.material.normalMap = normalMap;
                },
                {
                threadThickness: 2,   //The thickness of the thread quads
                jumpThreadThickness: 0.01, //The thickness of "jump threads" those little white threads in the back
                palette: ["orange", "white", "pink", "white", "black"], //The colors to assign to each color stop in the file, basically the thread colors you want to use
                })
            })
    })


            
