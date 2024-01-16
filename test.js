import DSTLoader from "./DSTLoader.js";

export default function Test({
  THREE,
  scene,
  renderer,
  camera,
  controls,
  gltfLoader,
  gui,
}) {
  //scene.background = new THREE.Color(0xffffff);
  //scene.add(new THREE.HemisphereLight(0xffffcc, 0x333399, 1.0));

  camera.position.set(0, 0.0, 25); //9,0,-15)
  controls.target.set(0, 0.0, 0);
  let dstLoader = new DSTLoader(THREE);

  let animLines;
  let lcount;
  let texLoader = new THREE.TextureLoader();
  texLoader.load(
    "./assets/NormalMap%20(10).png",
    (normalMap) => {
      new THREE.TextureLoader().load(
        "./assets/image%20(73).jpg",
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
          normalMap.colorSpace = THREE.LinearSRGBColorSpace;

          let loadDST = (url, cbfn, options) => {
            dstLoader.load(
              url,
              (lines) => {
                scene.add(lines.mesh);
                lines.mesh.material.map = tex;
                lines.mesh.material.normalMap = normalMap;
                lines.drawRange = 1;
                gui.add(lines, "quads");
                gui.add(lines, "drawRange", 0, 1);
                gui.add(lines, "threadThickness", 0.0, 10);
                gui.add(lines, "jumpThreadThickness", 0.0, 10);
                let pal = lines.palette;

                pal.forEach((c, i) => {
                  let p = {};
                  p["color" + i] = new THREE.Color(c);
                  gui.addColor(p, "color" + i).onChange((v, vv) => {
                    pal[i] = "#" + v.getHexString();
                    lines.palette = pal;
                  });
                });

                let pplane;
                gui.add(
                  {
                    makeTex: () => {
                      pplane && pplane.material.map.dispose();
                      let tex = lines.toTexture(renderer, scene, 2048);

                      let { width, height } = tex.source.data;
                      let pl =
                        pplane ||
                        (pplane = new THREE.Mesh(
                          new THREE.PlaneGeometry(width, height),
                          new THREE.MeshBasicMaterial({
                            map: tex,
                            transparent: true,
                          })
                        ));
                      pplane.scale.set(0.004, 0.004, 0.004);

                      pl.material.map = tex;
                      pl.position.copy(lines.mesh.position);
                      pl.position.y += 10;
                      scene.add(pl);
                    },
                  },
                  "makeTex"
                );
                cbfn(lines);
              },
              options
            );
          };
          loadDST(
            "./assets/Sample5/WOLFHD7.dst",
            (lines) => {
              lines.mesh.position.x -= 10;
            },
            {
              threadThickness: 2,
              jumpThreadThickness: 0.01,
              palette: ["white", "lightgray", "darkgray", "black", "white"],
              // palette:null,
            }
          );

          loadDST(
            "./assets/Sample2/CAT2.dst",
            (lines) => {
              lines.mesh.position.x += 10;
            },
            {
              threadThickness: 2,
              jumpThreadThickness: 0.01,
              palette: ["orange", "white", "pink", "white", "black"],
            }
          );

          loadDST(
            "./assets/Sample3/ELECTRNCSJK14.dst",
            (lines) => {},
            {
              threadThickness: 3,
              jumpThreadThickness: 0.01,
              palette: [
                "white",
                "white",
                "white",
                "gray",
                "brown",
                "white",
                "blue",
                "pink",
                "brown",
                "teal",
                "white",
                "black",
                "white",
              ],
              //palette:[],
            }
          );
        }
      );
    }
  );

  this.update = () => {};
}
