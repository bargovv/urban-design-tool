// =============================
// UI + DASHBOARD CONTROLLER
// =============================

// Called when user edits attributes in sidebar
function updateAttributes() {
    const id = window.UD.selectedID;
    if (!id) return;

    const f = window.UD.selectedFeature;
    if (!f) return;

    // Read UI values
    const use    = document.getElementById("landuse").value;
    const floors = Number(document.getElementById("floors").value);
    const height = Number(document.getElementById("height").value);
    const notes  = document.getElementById("notes").value;

    // Update stored attributes
    f.properties.attrs = {
        landuse: use,
        floors: floors,
        height: height,
        notes: notes
    };

    // Update 2D colors and selected outline
    highlightPlot(id);

    // Update dashboard + 3D building mass
    refreshDashboard();
    refresh3DForPlot(id);

    saveToLocalStorage();
}


// ========================================
// DASHBOARD CALCULATION + TABLE + KPIs
// ========================================

function refreshDashboard() {

    let totalArea = 0;
    let totalRoadArea = 0;
    let totalBUA = 0;

    let landUseCount = {
        residential: 0,
        commercial: 0,
        mixed: 0,
        institutional: 0,
        empty: 0
    };

    const tbody = document.querySelector("#summary-table tbody");
    tbody.innerHTML = "";

    window.UD.data.features.forEach(f => {

        // Road
        if (f.properties.type === "road") {
            totalRoadArea += f.properties.area;
            return;
        }

        // Plots only
        if (f.properties.type !== "plot") return;

        const area = f.properties.area;
        totalArea += area;

        const attrs = f.properties.attrs || {
            landuse: "residential",
            floors: 0,
            height: 0,
            notes: ""
        };

        // BUA = floors * area
        const bua = attrs.floors * area;
        totalBUA += bua;

        // land-use contribution to donut
        landUseCount[attrs.landuse] += area;

        // FAR for table
        const FAR = area > 0 ? (bua / area) : 0;

        // Table row
        tbody.innerHTML += `
            <tr>
                <td>${f.properties.id}</td>
                <td>${attrs.landuse}</td>
                <td>${attrs.floors}</td>
                <td>${bua.toFixed(2)}</td>
                <td>${area.toFixed(2)}</td>
                <td>${FAR.toFixed(2)}</td>
            </tr>
        `;
    });

    // KPIs
    const FAR = totalArea > 0 ? (totalBUA / totalArea) : 0;

    document.getElementById("kpi-site").innerText = totalArea.toFixed(2) + " m²";
    document.getElementById("kpi-road").innerText = totalRoadArea.toFixed(2) + " m²";
    document.getElementById("kpi-bua").innerText = totalBUA.toFixed(2) + " m²";
    document.getElementById("kpi-far").innerText  = FAR.toFixed(2);

    // Update donut chart
    updateDonut(landUseCount);
}


// ========================================
// DONUT CHART
// ========================================

let donutChart = null;

function updateDonut(counts) {
    const ctx = document.getElementById("donut").getContext("2d");

    const labels = ["Residential", "Commercial", "Mixed", "Institutional", "Empty"];
    const values = [
        counts.residential,
        counts.commercial,
        counts.mixed,
        counts.institutional,
        counts.empty
    ];

    const colors = [
        "#66aaff",
        "#ff9933",
        "#aa66dd",
        "#66dd99",
        "#cccccc"
    ];

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
        }
    });
}


// ========================================
// SIDEBAR LOADING OF ATTRIBUTES
// ========================================

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
    document.getElementById("floors").value  = attrs.floors;
    document.getElementById("height").value  = attrs.height;
    document.getElementById("notes").value   = attrs.notes;
}


// ========================================
// OPTIONAL — LOCAL STORAGE SAVE/LOAD
// ========================================

function saveToLocalStorage() {
    try {
        localStorage.setItem("ud-tool-data", JSON.stringify(window.UD.data));
    } catch (e) {
        console.warn("LocalStorage disabled or full.", e);
    }
}

function loadFromLocalStorage() {
    try {
        const d = localStorage.getItem("ud-tool-data");
        if (d) return JSON.parse(d);
    } catch (e) {}
    return null;
}

window.updateAttributes = updateAttributes;
window.refreshDashboard = refreshDashboard;
window.loadPlotIntoSidebar = loadPlotIntoSidebar;
