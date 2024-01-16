//DST embroidery file loader for THREEJS by thrax. 1/15/24

/*

This is a loader/parser/renderer for the .dst embroidery machine file format.
It renders the stitches to textured geometry, and can optionally then render that to a rendertaret for
more efficient display..

Colors , geometry, and thread parameters can be changed on the fly...
a normalized drawRange is supported to display the stitches at different times in the process..

the loader takes an options parameter, and returns a container for the resulting mesh or line primitive

options:
  quads:true | fals  , // whether to generate quads or line primitives...
  threadThickness:0 to Infinity.. defaults to 2
  jumpThreadThickness:0 to Infinity.. defaults to 0.01
  palette:['red','white','blue'] .. the colors to use for the thread color steps.. 
             // ideally 1+ the number of thread color steps in the file..
             // unsupplied entries are set to random colors...

the load method returns an object:
the object returned has:

mesh: the Mesh or Line primitive...
and then all the parameters in "options" which can be changed on the fly.

*/

import * as THREE from "three";

export default function DSTLoader() {
    function decodeCoordinate(byte1, byte2, byte3) {
        let cmd = byte1 | (byte2 << 8) | (byte3 << 16);
        let x = 0,
            y = 0,
            jump,
            cstop;
        let bit = (bit) => cmd & (1 << bit);
        if (bit(23)) y += 1;
        if (bit(22)) y -= 1;
        if (bit(21)) y += 9;
        if (bit(20)) y -= 9;
        if (bit(19)) x -= 9;
        if (bit(18)) x += 9;
        if (bit(17)) x -= 1;
        if (bit(16)) x += 1;

        if (bit(15)) y += 3;
        if (bit(14)) y -= 3;
        if (bit(13)) y += 27;
        if (bit(12)) y -= 27;
        if (bit(11)) x -= 27;
        if (bit(10)) x += 27;
        if (bit(9)) x -= 3;
        if (bit(8)) x += 3;

        if (bit(7)) jump = true;
        if (bit(6)) cstop = true;
        if (bit(5)) y += 81;
        if (bit(4)) y -= 81;
        if (bit(3)) x -= 81;
        if (bit(2)) x += 81;
        /*
//FROM THE SPEC:
23	Y += 1 add 0.1 mm to needle's Y current coordinate
22	Y -= 1 subtract 0.1 mm from the needle's current Y position
21	Y += 9
20	Y -= 9
19	X -= 9
18	X += 9
17	X -= 1
16	X += 1
15	Y += 3
14	Y -= 3
13	Y += 27
12	Y -= 27
11	X -= 27
10	X += 27
9	X -= 3
8	X += 3
7	Jump stitch (not a normal stitch)
6	Stop for colour change or end of pattern
5	Y += 81
4	Y -= 81, the end-of-pattern code sets both Y += 81 and Y -= 81 which cancel each other
3	X -= 81
2	X += 81
*/
        return { x, y, jump, cstop };
    }
    async function loadBinaryData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const buffer = await response.arrayBuffer();
            return buffer;
        } catch (error) {
            console.error("Failed to load binary data:", error);
        }
    }
    let quads = true;
    let threadThickness = 2;
    let jumpThreadThickness = 0.1;
    let palette = ["black", "white", "red", "gray", "yellow", "orange"];
    let pidx = 0;
    let v0 = new THREE.Vector3();
    function parseDST(buffer) {
        const dataView = new DataView(buffer);
        const start = 512; // Starting byte
        const indices = [];
        const vertices = [];
        const colors = [];
        const normals = [];
        const uvs = [];
        let cx = 0;
        let cy = 0;
        let cr = 1,
            cg = 1,
            cb = 1;

        let header = String.fromCharCode.apply(
            String,
            new Uint8Array(buffer, 0, 512)
        );

        let coff = header.indexOf("CO:");
        let colorCount = 0;
        if (coff > 0) colorCount = parseInt(header.slice(coff + 3, coff + 7));

        let vcount = 0;
        let wasJumpOrStop = false;
        let pidx = 0;
        let cpalette;
        if (!palette) palette = [];
        while (palette.length < colorCount + 1) {
            cr = Math.random();
            cg = Math.random();
            cb = Math.random();
            v0.set(cr, cg, cb).normalize();
            palette.push(
                "#" + new THREE.Color(v0.x, v0.y, v0.z).getHexString()
            );
        }

        cpalette = [];
        for (let i = 0; i < palette.length; i++) {
            cpalette[i] = new THREE.Color(palette[i]);
            let p = cpalette[pidx % cpalette.length];
            cr = p.r;
            cg = p.g;
            cb = p.b;
        }
        for (let i = start; i < dataView.byteLength; i += 3) {
            if (i >= dataView.byteLength - 3) break;

            const byte1 = dataView.getUint8(i);
            const byte2 = dataView.getUint8(i + 1);
            const byte3 = dataView.getUint8(i + 2);

            // Check for end of file sequence
            if (byte1 === 0x00 && byte2 === 0x00 && byte3 === 0xf3) {
                break;
            }
            const { x, y, cstop, jump } = decodeCoordinate(byte3, byte2, byte1);
            let px = cx,
                py = cy;
            cx += x;
            cy += y;
            if (cstop) {
                if (cpalette) {
                    //Get next step color
                    pidx++;
                    let p = cpalette[pidx % cpalette.length];
                    cr = p.r;
                    cg = p.g;
                    cb = p.b;
                } else {
                    cr = Math.random();
                    cg = Math.random();
                    cb = Math.random();
                    v0.set(cr, cg, cb).normalize();
                    cr = v0.x;
                    cg = v0.y;
                    cb = v0.z;
                }
            }

            if (quads) {
                let dx = cx - px;
                let dy = cy - py;
                let dtx = -dy;
                let dty = dx;

                let llen = v0.set(dtx, dty, 0).length();
                if (llen) v0.multiplyScalar(1 / llen);
                let thickness = wasJumpOrStop
                    ? jumpThreadThickness
                    : threadThickness;
                dtx = v0.x * thickness;
                dty = v0.y * thickness;
                //if (jump || cstop) vertices.push(Infinity, Infinity, Infinity);
                //else

                vertices.push(px + dtx, py + dty, 0);
                vertices.push(px - dtx, py - dty, 0);
                vertices.push(cx - dtx, cy - dty, 0);
                vertices.push(cx + dtx, cy + dty, 0);
                let vy = Math.random() * 0.5;
                uvs.push(
                    0,
                    0 + vy,
                    1,
                    0 + vy,
                    1,
                    llen / 80 + vy,
                    0,
                    llen / 80 + vy
                );

                colors.push(cr, cg, cb);
                colors.push(cr, cg, cb);
                colors.push(cr, cg, cb);
                colors.push(cr, cg, cb);
                //normals.push(dtx, dty, .5, -dtx, -dty, .5, -dtx, -dty, .5, dtx, dty, .5);
                normals.push(0, 0, 1, -0, -0, 1, -0, -0, 1, 0, 0, 1);
                indices.push(
                    vcount,
                    vcount + 1,
                    vcount + 2,
                    vcount + 2,
                    vcount + 3,
                    vcount + 0
                );
                vcount += 4;
            } else {
                //lines
                vertices.push(cx, cy, 0); // Z-coordinate is 0 as embroidery designs are 2D
                colors.push(cr, cg, cb);
            }
            wasJumpOrStop = jump || cstop;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );
        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colors, 3)
        );
        uvs.length &&
            geometry.setAttribute(
                "uv",
                new THREE.Float32BufferAttribute(uvs, 2)
            );
        normals.length &&
            geometry.setAttribute(
                "normal",
                new THREE.Float32BufferAttribute(normals, 3)
            );
        indices.length && geometry.setIndex(indices);
        return geometry;
    }

    this.load = (url, resolve, opts = {}) => {
        loadBinaryData(url).then((buffer) => {
            quads = true;
            threadThickness = 2;
            jumpThreadThickness = 0.01;
            palette = null;
            let generate = () => {
                if (opts.quads !== undefined) quads = opts.quads;
                if (opts.threadThickness !== undefined)
                    threadThickness = opts.threadThickness;
                if (opts.jumpThreadThickness !== undefined)
                    jumpThreadThickness = opts.jumpThreadThickness;
                if (opts.palette !== undefined) palette = opts.palette;

                opts.quads = quads;
                opts.threadThickness = threadThickness;
                opts.jumpThreadThickness = jumpThreadThickness;
                opts.palette = palette;
                const geometry = parseDST(buffer, opts);
                opts.palette = palette;

                let lines = quads
                    ? new THREE.Mesh(
                          geometry,
                          new THREE.MeshStandardMaterial({
                              color: "white",
                              vertexColors: true,
                              side: THREE.DoubleSide,
                              depthTest: false,
                              metalness: 0.0,
                              roughness: 0.9,
                              normalScale: new THREE.Vector2(0.8, 0.8),
                          })
                      )
                    : new THREE.Line(
                          geometry,
                          new THREE.LineBasicMaterial({
                              color: "white",
                              vertexColors: true,
                          })
                      );

                lines.scale.set(0.01, 0.01, 0.01);
                lines.updateMatrixWorld(true);
                return lines;
            };

            let mesh = generate();

            let params = {
                mesh,
                get quads() {
                    return opts.quads || false;
                },
                set quads(on) {
                    opts.quads = on == true;
                    params.meshNeedsUpdate = true;
                },
                get threadThickness() {
                    return opts.threadThickness;
                },
                set threadThickness(f) {
                    opts.threadThickness = parseFloat(f);
                    params.meshNeedsUpdate = true;
                },
                get jumpThreadThickness() {
                    return opts.jumpThreadThickness;
                },
                set jumpThreadThickness(f) {
                    opts.jumpThreadThickness = parseFloat(f);
                    params.meshNeedsUpdate = true;
                },
                get palette() {
                    return opts.palette;
                },
                set palette(arry) {
                    opts.palette = arry;
                    params.meshNeedsUpdate = true;
                },

                toTexture(renderer, scene, maxDim) {
                    if (!opts.map) {
                        let bounds = new THREE.Box3();
                        bounds.setFromObject(params.mesh);
                        let bsz = bounds.getSize(new THREE.Vector3());

                        const camera = new THREE.OrthographicCamera(
                            -bsz.x / 2,
                            bsz.x / 2,
                            bsz.y / 2,
                            -bsz.y / 2,
                            1,
                            1000
                        );
                        params.mesh.localToWorld(camera.position.set(0, 0, 0));
                        camera.position.z += 500; // adjust as needed
                        camera.lookAt(params.mesh.position);

                        if (bsz.x > bsz.y) {
                            bsz.y = maxDim * (bsz.y / bsz.x);
                            bsz.x = maxDim;
                        } else {
                            bsz.x = maxDim * (bsz.x / bsz.y);
                            bsz.y = maxDim;
                        }
                        const renderTarget = new THREE.WebGLRenderTarget(
                            bsz.x | 0,
                            bsz.y | 0,
                            {
                                generateMipmaps: true,
                                minFilter: THREE.LinearMipmapLinearFilter,
                                magFilter: THREE.LinearFilter,
                            }
                        );
                        renderer.setRenderTarget(renderTarget);
                        let sv = scene.background;
                        scene.background = null;
                        renderer.setClearAlpha(0);
                        renderer.render(scene, camera);
                        scene.background = sv;
                        renderer.setClearAlpha(1);
                        renderer.setRenderTarget(null);
                        return renderTarget.texture;
                    }
                },
                get normalMap() {},
            };
            let meshUpdateStarted = false;
            let updateStarted = false;
            mesh.onBeforeRender = function () {
                if (params.drawRange !== undefined) {
                    let dr = params.mesh.geometry.index
                        ? params.mesh.geometry.index.count
                        : params.mesh.geometry.attributes.position.count;
                    params.mesh.geometry.drawRange.count =
                        (params.drawRange * dr) | 0;
                }
                if (params.meshNeedsUpdate) {
                    if (meshUpdateStarted) return;
                    meshUpdateStarted = true;
                    setTimeout(() => {
                        params.meshNeedsUpdate = false;
                        let newmesh = generate();
                        params.mesh.parent.add(newmesh);
                        params.mesh.geometry.dispose();
                        params.mesh.parent.remove(params.mesh);
                        newmesh.position.copy(params.mesh.position);
                        newmesh.scale.copy(params.mesh.scale);
                        newmesh.rotation.copy(params.mesh.rotation);
                        newmesh.material.map = mesh.material.map;
                        newmesh.material.normalMap = mesh.material.normalMap;
                        newmesh.onBeforeRender = params.mesh.onBeforeRender;
                        params.mesh = newmesh;
                        meshUpdateStarted = false;
                    }, 10);
                } else if (params.needsUpdate) {
                    if (updateStarted) return;
                    updateStarted = true;
                    setTimeout(() => {
                        params.needsUpdate = false;
                        params.mesh.geometry.dispose();
                        params.mesh.geometry = generate().geometry;
                        updateStarted = false;
                    }, 10);
                }
            };
            resolve(params);
        });
    };
}
