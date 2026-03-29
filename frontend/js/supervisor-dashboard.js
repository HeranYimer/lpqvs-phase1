// let chartInstance = null;

const refreshBtn = document.getElementById("refreshBtn");
// const chartTypeSelect = document.getElementById("chartType");

async function loadDashboard() {

  try {

    // ================= SUMMARY =================
    const res1 = await fetch("http://localhost:5000/api/reports/summary", {
      credentials: "include"
    });

    const summary = await res1.json();

    document.getElementById("total").innerText = summary.total || 0;
    document.getElementById("pending").innerText = summary.pending || 0;
    document.getElementById("approved").innerText = summary.approved || 0;
    document.getElementById("rejected").innerText = summary.rejected || 0;

    // ================= DAILY =================
    const res2 = await fetch("http://localhost:5000/api/reports/daily", {
      credentials: "include"
    });

    const daily = await res2.json();

    const labels = daily.map(d => d.date);
    const values = daily.map(d => d.count);

    // TABLE
    const table = document.getElementById("dailyTable");
    table.innerHTML = "";

    daily.forEach(d => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${d.date}</td>
        <td>${d.count}</td>
      `;

      table.appendChild(row);
    });

    // CHART
    // renderChart(labels, values, chartTypeSelect.value);

    // // chart type change
    // chartTypeSelect.addEventListener("change", () => {
    //   renderChart(labels, values, chartTypeSelect.value);
    // });

  } catch (err) {
    console.error(err);
    alert("Failed to load dashboard");
  }
}

// ================= CHART =================
// function renderChart(labels, values, type) {

//   const ctx = document.getElementById("dailyChart").getContext("2d");

//   if (chartInstance) {
//     chartInstance.destroy();
//   }

//   chartInstance = new Chart(ctx, {
//     type: type,
//     data: {
//       labels: labels,
//       datasets: [{
//         label: "Applications",
//         data: values
//       }]
//     },
//     options: {
//       responsive: true
//     }
//   });
// }

// ================= EVENTS =================
refreshBtn.addEventListener("click", loadDashboard);

// initial load
loadDashboard();