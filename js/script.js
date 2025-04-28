"use strict";

// VARIABLES -----------------------
const riskChartContext = document.getElementById('riskChart').getContext('2d');

const colors = [
  'rgba(255, 102, 255)',
  'rgba(255, 0, 0)',
  'rgba(255, 169, 0)',
  'rgba(255, 255, 0)',
  'rgba(144, 238, 144)'
];

const backgrounds = [
  'rgba(255, 102, 255, 0.5)',
  'rgba(255, 0, 0, 0.5)',
  'rgba(255, 169, 0, 0.5)',
  'rgba(255, 255, 0, 0.5)',
  'rgba(144, 238, 144, 0.5)'
];

const threats = [
  "Skills required", "Motive", "Opportunity", "Population Size",
  "Ease of Discovery", "Ease of Exploit", "Awareness", "Intrusion Detection",
  "Loss of confidentiality", "Loss of Integrity", "Loss of Availability", "Loss of Accountability",
  "Financial damage", "Reputation damage", "Non-Compliance", "Privacy violation"
];

const partials = ["sl", "m", "o", "s", "ed", "ee", "a", "id", "lc", "li", "lav", "lac", "fd", "rd", "nc", "pv"];

const riskChartOptions = {
  legend: {
    position: 'top',
    display: false,
  },
  title: {
    display: false,
    text: 'Chart.js Radar Chart'
  },
  scale: {
    ticks: {
      beginAtZero: true,
      suggestedMin: 0,
      suggestedMax: 10,
      stepSize: 1
    }
  }
};

// Initialize the radar chart
let riskChart = new Chart(riskChartContext, {
  type: 'radar',
  data: {
    labels: [],
    datasets: [{
      data: [],
      pointBackgroundColor: "",
      backgroundColor: "",
      borderColor: "",
      borderWidth: 2
    }]
  },
  options: riskChartOptions
});

// Update the chart initially
updateRiskChart([], "NOTE");

// Load vectors if present in the URL
const vectorParam = getUrlParameter('vector');
if (vectorParam) {
  loadVectors(vectorParam);
}

// FUNCTIONS -----------------------

// Load vectors from the URL parameter
function loadVectors(vector) {
  vector = vector.replace('(', '').replace(')', '');
  const values = vector.split('/');

  if (values.length === partials.length) {
    values.forEach((value, index) => {
      const [, vectorValue] = value.split(':');
      $(`#${partials[index].toLowerCase()}`).val(vectorValue);
    });
  } else {
    swal("Hey!!", "The vector is not correct, make sure you have copied correctly", "error");
  }

  calculate();
}

// Calculate scores and update the UI
function calculate() {
  const likelihoodScore = calculateScore(partials.slice(0, 8));
  const impactScore = calculateScore(partials.slice(8));

  const likelihoodRisk = getRisk(likelihoodScore);
  const impactRisk = getRisk(impactScore);

  updateScoreDisplay(".LS", likelihoodScore, likelihoodRisk);
  updateScoreDisplay(".IS", impactScore, impactRisk);

  const riskSeverity = getCriticality(likelihoodRisk, impactRisk);
  updateRiskSeverityDisplay(riskSeverity);

  const dataset = partials.map(partial => $(`#${partial}`).val());
  updateRiskChart(dataset, riskSeverity);

  const scoreVector = generateScoreVector();
  $('#score').text(scoreVector);
  $("#score").attr("href", `https://optitool.github.io/OWASP-Calculator/?vector=${scoreVector}`);
}

// Calculate the average score for a set of inputs
function calculateScore(factors) {
  const total = factors.reduce((sum, factor) => sum + +$(`#${factor}`).val(), 0);
  return (total / factors.length).toFixed(3);
}

// Update the score display with the calculated value and risk level
function updateScoreDisplay(selector, score, riskLevel) {
  $(selector).text(`${score} ${riskLevel}`);
  updateClass(selector, riskLevel);
}

// Update the risk severity display
function updateRiskSeverityDisplay(severity) {
  $(".RS").text(severity);
  updateClass(".RS", severity);
}

// Update the class for a given selector based on the risk level
function updateClass(selector, riskLevel) {
  const classMap = {
    "NOTE": "classNote",
    "LOW": "classLow",
    "MEDIUM": "classMedium",
    "HIGH": "classHigh",
    "CRITICAL": "classCritical"
  };

  Object.values(classMap).forEach(cls => $(selector).removeClass(cls));
  $(selector).addClass(classMap[riskLevel] || "classNote");
}

// Generate the score vector string
function generateScoreVector() {
  return `(${partials.map(partial => `${partial.toUpperCase()}:${$(`#${partial}`).val()}`).join('/')})`;
}

// Determine the risk level based on the score
function getRisk(score) {
  if (score == 0) return 'NOTE';
  if (score < 3) return 'LOW';
  if (score < 6) return 'MEDIUM';
  if (score <= 9) return 'HIGH';
  return 'CRITICAL';
}

// Determine the final risk severity based on likelihood and impact
function getCriticality(likelihood, impact) {
  if (likelihood === "LOW" && impact === "LOW") return 'NOTE';
  if ((likelihood === "LOW" && impact === "MEDIUM") || (likelihood === "MEDIUM" && impact === "LOW")) return 'LOW';
  if ((likelihood === "LOW" && impact === "HIGH") || (likelihood === "MEDIUM" && impact === "MEDIUM") || (likelihood === "HIGH" && impact === "LOW")) return 'MEDIUM';
  if ((likelihood === "HIGH" && impact === "MEDIUM") || (likelihood === "MEDIUM" && impact === "HIGH")) return 'HIGH';
  if (likelihood === "HIGH" && impact === "HIGH") return 'CRITICAL';
  return 'NOTE';
}

// Get a URL parameter by name
function getUrlParameter(name) {
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(location.search);
  return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : '';
}

// Update the radar chart with new data
function updateRiskChart(dataset, riskSeverity) {
  const severityIndex = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "NOTE": 4
  }[riskSeverity] || 4;

  riskChart.data.labels = threats;
  riskChart.data.datasets[0].data = dataset;
  riskChart.data.datasets[0].pointBackgroundColor = colors[severityIndex];
  riskChart.data.datasets[0].backgroundColor = backgrounds[severityIndex];
  riskChart.data.datasets[0].borderColor = colors[severityIndex];

  riskChart.update();
}

// Copy the vector link to the clipboard
function copyToClipboard() {
  const scoreElement = document.getElementById("score");
  navigator.clipboard.writeText(scoreElement.href)
    .then(() => {
      alert("Vector link copied to clipboard!");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
}