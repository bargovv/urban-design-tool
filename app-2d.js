// GLOBAL STATE
window.UD = {
    map: null,
    data: null,
    selectedID: null,
    selectedFeature: null,
    plotLayers: {},
    roadLayers: {},
    landuseView: true   // NEW → toggle land-use coloring
};

/*-----------------------------------------------------
    LAND USE COLORS
-----------------------------------------------------*/
function getLandUseColor(use) {
    return {
        residential: "#66aaff",
        commercial: "#ff9933",
        mixed: "#aa66dd",
        institutional: "#66dd99",
        empty: "#cccccc"
    }[use] || "#66aaff";
}

/*-----------------------------------------------------
    INITIALIZE 2D VIEW
-----------------------------------------------------*/
function init2D() {
    const map = L.map("map", {
        crs: L.CRS.Simple,
        minZoom: -4,
    });
    window.UD.map = map;

    fetch("plots.geojson")
        .then(r => r.json())
        .then(json => {
            window.UD.data = json;
            window.UD_DATA = json; // needed for 3D sync

            // Compute bounds
            const xs = [], ys = [];
            json.features.forEach(f => {
                f.geometry.coordinates[0].forEach(c => {
                    xs.push(c[0]);
                    ys.push(c[1]);
                });
            });

            map.fitBounds([[Math.min(...ys), Math.min(...xs)], [Math.max(...ys), Math.max(...xs)]]);

            /*----------------------------------------------
                DRAW LAYERS
            ----------------------------------------------*/
            const geoLayer = L.geoJSON(json, {
                coordsToLatLng: c => L.latLng(c[1], c[0]),

                style: f => {
                    if (f.properties.type === "road")
                        return {
                            color: "#555",
                            weight: 1,
                            fillColor: "#bbbbbb",
                            fillOpacity: 0.7
                        };

                    // PLOT colors (respect landuse toggle)
                    const use = f.properties.attrs?.landuse || "residential";
                    return {
                        color: "#222",
                        weight: 1,
                        fillColor: window.UD.landuseView ? getLandUseColor(use) : "#99bbdd",
                        fillOpacity: 0.75
                    };
                },

                onEachFeature: (f, layer) => {

                    if (f.properties.type === "plot") {
                        window.UD.plotLayers[f.properties.id] = layer;
                    } else if (f.properties.type === "road") {
                        window.UD.roadLayers[f.properties.id] = layer;
                    }

                    layer.on("click", () => {
                        if (f.properties.type !== "plot") return;

                        window.UD.selectedID = f.properties.id;
                        window.UD.selectedFeature = f;

                        highlightPlot(f.properties.id);
                        loadPlotIntoSidebar(f);
                    });
                }
            }).addTo(map);

            refreshDashboard();
        });
}

/*-----------------------------------------------------
    HIGHLIGHT ONE PLOT (OUTLINE ONLY)
-----------------------------------------------------*/
function highlightPlot(id) {

    Object.entries(window.UD.plotLayers).forEach(([pid, layer]) => {
        const feature = layer.feature;
        const use = feature.properties.attrs?.landuse || "residential";

        layer.setStyle({
            color: "#222",
            weight: pid === id ? 4 : 1,
            fillColor: window.UD.landuseView ? getLandUseColor(use) : "#99bbdd",
            fillOpacity: 0.75
        });
    });
}

/*-----------------------------------------------------
    LOAD ATTRIBUTES INTO SIDEBAR
-----------------------------------------------------*/
function loadPlotIntoSidebar(f) {
    document.getElementById("plot-info").innerHTML = `
        <b>Plot ID:</b> ${f.properties.id}<br>
        <b>Area:</b> ${f.properties.area.toFixed(2)} m²<br>
        <b>Layer:</b> ${f.properties.layer}<br>
    `;

    const attrs = f.properties.attrs || {
        landuse: "residential",
        floors: 0,
        height: 0,
        notes: ""
    };

    document.getElementById("landuse").value = attrs.landuse;
    document.getElementById("floors").value = attrs.floors;
    document.getElementById("height").value = attrs.height;
    document.getElementById("notes").value = attrs.notes;
}

/*-----------------------------------------------------
    UPDATE ATTRIBUTES + REFRESH COLORS + DASHBOARD
-----------------------------------------------------*/
function updateAttributes() {
    const id = window.UD.selectedID;
    if (!id) return;

    const f = window.UD.selectedFeature;

    f.properties.attrs = {
        landuse: document.getElementById("landuse").value,
        floors: Number(document.getElementById("floors").value),
        height: Number(document.getElementById("height").value),
        notes: document.getElementById("notes").value
    };

    highlightPlot(id);
    refreshDashboard();
}

/*-----------------------------------------------------
    LAND USE TOGGLE
-----------------------------------------------------*/
function toggleLandUse() {
    window.UD.landuseView = !window.UD.landuseView;

    Object.entries(window.UD.plotLayers).forEach(([pid, layer]) => {
        const f = layer.feature;
        const use = f.properties.attrs?.landuse || "residential";

        layer.setStyle({
            color: "#222",
            weight: window.UD.selectedID === pid ? 4 : 1,
            fillColor: window.UD.landuseView ? getLandUseColor(use) : "#99bbdd",
            fillOpacity: 0.75
        });
    });
}

/*-----------------------------------------------------
    EXPORT JSON
-----------------------------------------------------*/
function exportJSON() {
    const blob = new Blob(
        [JSON.stringify(window.UD.data, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ud-tool-data.json";
    a.click();
}

/*-----------------------------------------------------
    EXPORT CSV
-----------------------------------------------------*/
function exportCSV() {
    const rows = [["PlotID", "LandUse", "Floors", "Height", "Area", "Notes"]];

    window.UD.data.features.forEach(f => {
        if (f.properties.type !== "plot") return;

        const a = f.properties.attrs || {};
        rows.push([
            f.properties.id,
            a.landuse || "",
            a.floors || 0,
            a.height || 0,
            f.properties.area.toFixed(2),
            a.notes || ""
        ]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ud-tool-data.csv";
    a.click();
}

window.init2D = init2D;
window.toggleLandUse = toggleLandUse;
window.highlightPlot = highlightPlot;
window.updateAttributes = updateAttributes;
