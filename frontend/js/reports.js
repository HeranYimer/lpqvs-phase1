let chartInstance = null;

const filterBtn = document.getElementById("filterBtn");
const exportBtn = document.getElementById("exportBtn");
const spinner = document.getElementById("spinner");

let currentData = [];

filterBtn.addEventListener("click", loadFiltered);
exportBtn.addEventListener("click", exportCSV);

async function loadFiltered() {

  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  spinner.style.display = "block";

  try {

    const res = await fetch(`http://localhost:5000/api/reports/range?from=${from}&to=${to}`, {
      credentials: "include"
    });

    const data = await res.json();
    currentData = data;

    const labels = data.map(d => d.date);
    const values = data.map(d => d.count);

    const ctx = document.getElementById("reportChart").getContext("2d");

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Applications",
          data: values
        }]
      }
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load report");
  }

  spinner.style.display = "none";
}

// ✅ Export CSV
function exportCSV() {

  if (!currentData.length) {
    alert("No data to export");
    return;
  }

  let csv = "Date,Count\n";

  currentData.forEach(row => {
    csv += `${row.date},${row.count}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "report.csv";
  a.click();

  window.URL.revokeObjectURL(url);
}