// ============================
// 3D ENGINE FOR UD-TOOL
// ============================

window.UD3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    meshes: {}
};

// ------------------------------------
// SWITCH VIEW MODES
// ------------------------------------

function setMode3D() {

    console.log("Switch to 3D – container size:", 
        document.getElementById("three").clientWidth,
        document.getElementById("three").clientHeight
    );

    // Show 3D, hide 2D
    document.getElementById("map").style.display = "none";
    document.getElementById("three").style.display = "block";

    // Initialize scene if needed
    if (!window.UD3D.scene) {
        init3D();
    }

    // Always rebuild after switching
    rebuild3DScene();
}

function setMode2D() {
    document.getElementById("map").style.display = "block";
    document.getElementById("three").style.display = "none";
}


// ------------------------------------
// INITIALIZE 3D ENVIRONMENT
// ------------------------------------

function init3D() {

    const container = document.getElementById("three");
    console.log("init3D container size:", container.clientWidth, container.clientHeight);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    window.UD3D.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        50000
    );
    window.UD3D.camera = camera;
    camera.position.set(0, -400, 300);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    window.UD3D.renderer = renderer;

    // Lights
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(300, -500, 600);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x777777));

    // ORBIT CONTROLS (SketchUp style)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    controls.screenSpacePanning = true;

    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;

    controls.zoomSpeed = 1.2;
    controls.rotateSpeed = 0.9;
    controls.panSpeed = 0.8;

    controls.minDistance = 50;
    controls.maxDistance = 5000;

    controls.maxPolarAngle = Math.PI / 2.1;

    window.UD3D.controls = controls;

    animate3D();
}


// ------------------------------------
// ANIMATION LOOP
// ------------------------------------

function animate3D() {
    requestAnimationFrame(animate3D);

    if (window.UD3D.controls)
        window.UD3D.controls.update();

    if (window.UD3D.renderer)
        window.UD3D.renderer.render(window.UD3D.scene, window.UD3D.camera);

    // Auto reset if user zooms to infinity
    if (window.UD3D.camera.position.length() > 20000) {
        reset3DView();
    }
}


  
// ------------------------------------
// REBUILD 3D MASSING MODEL
// ------------------------------------

function rebuild3DScene() {

    if (!window.UD3D.scene) return;

    const scene = window.UD3D.scene;

    // Remove old meshes
    for (const id in window.UD3D.meshes) {
        scene.remove(window.UD3D.meshes[id]);
    }
    window.UD3D.meshes = {};

    // Add extrusions
    window.UD.data.features.forEach(f => {
        if (f.properties.type !== "plot") return;

        const mesh = buildExtrusion(f);
        if (mesh) {
            const id = f.properties.id;
            window.UD3D.meshes[id] = mesh;
            scene.add(mesh);
        }
    });

    recenterCamera();
}


// ------------------------------------
// BUILD EXTRUSION FOR A PLOT
// ------------------------------------

function buildExtrusion(f) {

    const coords = f.geometry.coordinates[0];

    const shape = new THREE.Shape();
    shape.moveTo(coords[0][0], coords[0][1]);

    for (let i = 1; i < coords.length; i++) {
        shape.lineTo(coords[i][0], coords[i][1]);
    }

    const attrs = f.properties.attrs || {
        landuse: "residential",
        floors: 0,
        height: 0
    };

    const height = attrs.height > 0 ? attrs.height : attrs.floors * 3;

    if (height <= 0) return null;

    const geom = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false
    });

    const mat = new THREE.MeshLambertMaterial({
        color: landUseColor(attrs.landuse),
        transparent: true,
        opacity: 0.95
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.z = 0;
    return mesh;
}


// ------------------------------------
// COLOR BY LAND USE
// ------------------------------------

function landUseColor(use) {
    return {
        residential: 0x66aaff,
        commercial: 0xff9933,
        mixed: 0xaa66dd,
        institutional: 0x66dd99,
        empty: 0xcccccc
    }[use] || 0x66aaff;
}


// ------------------------------------
// RECENTER CAMERA
// ------------------------------------

function recenterCamera() {

    let xs = [], ys = [];

    window.UD.data.features.forEach(f => {
        if (f.properties.type !== "plot") return;
        f.geometry.coordinates[0].forEach(([x, y]) => {
            xs.push(x);
            ys.push(y);
        });
    });

    const minx = Math.min(...xs);
    const maxx = Math.max(...xs);
    const miny = Math.min(...ys);
    const maxy = Math.max(...ys);

    const cx = (minx + maxx) / 2;
    const cy = (miny + maxy) / 2;
    const size = Math.max(maxx - minx, maxy - miny);

    const camera = window.UD3D.camera;

    camera.position.set(cx, cy - size * 1.5, size * 1.2);
    window.UD3D.controls.target.set(cx, cy, 0);
    window.UD3D.controls.update();
}


// ------------------------------------
// RESET VIEW (Button Support)
// ------------------------------------

function reset3DView() {
    recenterCamera();
}
window.reset3DView = reset3DView;


// ------------------------------------
// UPDATE SINGLE PLOT EXTRUSION
// ------------------------------------

function refresh3DForPlot(id) {

    if (!window.UD3D.scene) return;

    const scene = window.UD3D.scene;
    const f = window.UD.data.features.find(x => x.properties.id === id);
    if (!f) return;

    // remove old
    if (window.UD3D.meshes[id]) {
        scene.remove(window.UD3D.meshes[id]);
    }

    const mesh = buildExtrusion(f);
    if (mesh) {
        window.UD3D.meshes[id] = mesh;
        scene.add(mesh);
    }
}



// ------------------------------------
// HANDLE WINDOW RESIZE
// ------------------------------------

window.addEventListener("resize", () => {
    const div = document.getElementById("three");
    if (!window.UD3D.renderer) return;

    window.UD3D.renderer.setSize(div.clientWidth, div.clientHeight);
    window.UD3D.camera.aspect = div.clientWidth / div.clientHeight;
    window.UD3D.camera.updateProjectionMatrix();
});


// ------------------------------------
// EXPORT PUBLIC API
// ------------------------------------

window.setMode3D = setMode3D;
window.setMode2D = setMode2D;
window.refresh3DForPlot = refresh3DForPlot;
