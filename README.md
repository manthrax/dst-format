# DST Embroidery File Loader for THREE.JS

**Author:** thrax  
**Date:** January 15, 2024

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
