// ================================
// DATA ENGINE FOR UD-TOOL
// ================================

// This file manages:
// - attribute initialization
// - localStorage save/load
// - utility helpers
// - exporting CSV + JSON


// Called once after init2D loads plots.geojson
function initializePlotAttributes() {

    window.UD.data.features.forEach(f => {

        // Only plots get attributes
        if (f.properties.type !== "plot") return;

        if (!f.properties.attrs) {
            f.properties.attrs = {
                landuse: "residential",
                floors: 0,
                height: 0,
                notes: ""
            };
        }
    });
}


// =====================================
// SAFE LOCAL STORAGE MERGE
// =====================================

function saveToLocalStorage() {
    if (!window.UD?.data) return;

    try {
        localStorage.setItem("udtool-data", JSON.stringify(window.UD.data));
        console.log("%c[ud-tool] Saved to LocalStorage", "color: green");
    } catch (e) {
        console.warn("LocalStorage disabled or unavailable.", e);
    }
}

function loadFromLocalStorage() {

    const saved = localStorage.getItem("udtool-data");
    if (!saved) return;

    try {
        const savedJSON = JSON.parse(saved);

        // Match attributes with current GeoJSON structure
        savedJSON.features.forEach(sf => {
            const id = sf.properties.id;
            const target = window.UD.data.features.find(f => f.properties.id === id);

            if (!target) return;

            // copy attributes safely
            if (sf.properties.attrs) {
                target.properties.attrs = sf.properties.attrs;
            }
        });

        console.log("%c[ud-tool] Restored previous session", "color: green");
    } catch (e) {
        console.error("[ud-tool] Error loading saved data", e);
    }
}

function clearSavedData() {
    localStorage.removeItem("udtool-data");
    location.reload();
}


// =====================================
// UTILITY FUNCTIONS
// =====================================

function getPlot(id) {
    return window.UD.data.features.find(f => f.properties.id === id);
}

function computeBUA(plot) {
    if (!plot || plot.properties.type !== "plot") return 0;
    const a = plot.properties.attrs || {};
    return (a.floors || 0) * plot.properties.area;
}

function computeFAR(plot) {
    if (!plot || plot.properties.type !== "plot") return 0;

    const area = plot.properties.area;
    if (area <= 0) return 0;

    return computeBUA(plot) / area;
}


// =====================================
// EXPORTING - CSV / JSON
// =====================================

function exportJSON() {
    saveToLocalStorage();

    const blob = new Blob(
        [JSON.stringify(window.UD.data, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ud-tool-data.json";
    a.click();
}

function exportCSV() {
    const rows = [["PlotID", "LandUse", "Floors", "Height", "Area", "BUA", "FAR", "Notes"]];

    window.UD.data.features.forEach(f => {
        if (f.properties.type !== "plot") return;

        const a = f.properties.attrs || {};
        const bua = computeBUA(f);
        const FAR = computeFAR(f);

        rows.push([
            f.properties.id,
            a.landuse || "",
            a.floors || 0,
            a.height || 0,
            f.properties.area.toFixed(2),
            bua.toFixed(2),
            FAR.toFixed(2),
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


// =====================================
// GLOBAL EXPORTS
// =====================================

window.initializePlotAttributes = initializePlotAttributes;
window.saveToLocalStorage = saveToLocalStorage;
window.clearSavedData = clearSavedData;
window.getPlot = getPlot;
window.computeBUA = computeBUA;
window.computeFAR = computeFAR;
window.exportCSV = exportCSV;
window.exportJSON = exportJSON;
