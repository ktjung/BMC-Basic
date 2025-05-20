let chart;
let latestProfitUsd = 0;
let currentROI = null;

async function fetchBTCPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await res.json();
  return data.bitcoin.usd;
}

async function fetchExchangeRate() {
  const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  const data = await res.json();
  return data.rates.KRW;
}

function getHashrateUnit() {
  return document.querySelector('input[name="hashrate_unit"]:checked').value;
}

async function calculate() {
  const hashrate = parseFloat(document.getElementById("hashrate").value);
  const powerRate = parseFloat(document.getElementById("power").value);
  const electricity = parseFloat(document.getElementById("electricity").value);
  const feePercent = parseFloat(document.getElementById("fee").value);
  const hardwareCost = parseFloat(document.getElementById("hardware_cost").value);
  const hours = parseFloat(document.getElementById("hours").value);

  const btcPrice = await fetchBTCPrice();
  const blockRewardBTC = 3.125;
  const blocksPerDay = 144;
  const networkHashrate = 500000000; // TH/s

  let userHashrate = hashrate;
  const unit = getHashrateUnit();
  if (unit === "GH/s") userHashrate *= 0.001;
  if (unit === "MH/s") userHashrate *= 0.000001;

  const userHashrateHps = userHashrate * 1e12;
  let dailyBTC = blockRewardBTC * blocksPerDay * (userHashrateHps / (networkHashrate * 1e12));
  dailyBTC *= (1 - feePercent / 100);

  const revenueBeforeFee = dailyBTC * btcPrice;
  const revenueAfterFee = revenueBeforeFee - (revenueBeforeFee * feePercent / 100);
  const powerInKW = powerRate * userHashrate;
  const dailyCost = powerInKW * hours * electricity;
  const dailyProfit = revenueAfterFee - dailyCost;
  latestProfitUsd = dailyProfit;

  const roi = dailyProfit > 0 ? Math.ceil(hardwareCost / dailyProfit) : null;
  currentROI = roi;

  document.getElementById("btc_price").textContent = btcPrice.toFixed(2);
  document.getElementById("daily_btc").textContent = dailyBTC.toFixed(8);
  document.getElementById("monthly_btc").textContent = (dailyBTC * 30).toFixed(8);
  document.getElementById("yearly_btc").textContent = (dailyBTC * 365).toFixed(8);
  document.getElementById("daily_rev").textContent = revenueAfterFee.toFixed(2);
  document.getElementById("daily_cost").textContent = dailyCost.toFixed(2);
  document.getElementById("daily_profit").textContent = dailyProfit.toFixed(2);
  document.getElementById("roi").textContent = roi ? roi : "수익 없음";

  document.getElementById("output").classList.add("show");

  drawChart(dailyProfit, hardwareCost, roi, dailyBTC);
}

function drawChart(dailyProfit, hardwareCost, roi, dailyBTC = 0) {
  const labels = [1, 7, 30, 100, 200, 300, 365];
  if (roi && !labels.includes(roi)) {
    labels.push(roi);
    labels.sort((a, b) => a - b);
  }

  const profits = labels.map(day => +(dailyProfit * day).toFixed(2));
  const investments = labels.map(() => hardwareCost);
  const btcAmounts = labels.map(day => +(dailyBTC * day).toFixed(8));

  const barColors = labels.map(day => {
    if (roi && day === roi) return "rgba(0, 255, 0, 1)";
    if (roi && day > roi) return "rgba(255, 99, 132, 0.8)";
    return "rgba(54, 162, 235, 0.6)";
  });

  const ctx = document.getElementById("profitChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.map(l => `${l}일`),
      datasets: [
        {
          type: 'line',
          label: "BTC 채굴량",
          data: btcAmounts,
          borderColor: "orange",
          backgroundColor: "rgba(255, 165, 0, 0.3)",
          yAxisID: 'y1',
          tension: 0.3,
          borderWidth: 3,
          zIndex: 100
        },
        {
          label: "순이익 ($)",
          data: profits,
          backgroundColor: barColors,
          yAxisID: 'y',
        },
        {
          label: "투자금 ($)",
          data: investments,
          backgroundColor: "rgba(128, 128, 128, 0.4)",
          yAxisID: 'y',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const datasetLabel = tooltipItem.dataset.label;
              const value = tooltipItem.raw;

              if (datasetLabel === "BTC 채굴량") {
                return `${datasetLabel}: ${value} BTC`;
              }
              return `${datasetLabel}: $${value}`;
            }
          }
        },
        legend: {
          position: "top",
        }
      },
      scales: {
        y: {
          ticks: {
            beginAtZero: true,
            callback: value => `$${value}`
          }
        },
        y1: {
          position: "right",
          ticks: {
            callback: value => `${value} BTC`
          }
        }
      }
    }
  });
}

async function openModal() {
  const exchangeRate = await fetchExchangeRate();
  document.getElementById("exchangeRateDisplay").textContent = exchangeRate.toFixed(2);

  const daily = latestProfitUsd * exchangeRate;
  const monthly = daily * 30;
  const yearly = daily * 365;

  document.getElementById("dailyProfitKrw").textContent = Math.round(daily).toLocaleString('ko-KR');
  document.getElementById("monthlyProfitKrw").textContent = Math.round(monthly).toLocaleString('ko-KR');
  document.getElementById("yearlyProfitKrw").textContent = Math.round(yearly).toLocaleString('ko-KR');

  document.getElementById("exchangeModal").classList.add("open");
}

function closeModal() {
  document.getElementById("exchangeModal").classList.remove("open");
}

// 다크모드 토글
document.getElementById("darkToggle").addEventListener("change", function () {
  document.body.classList.toggle("dark-mode", this.checked);
});

// 설명 모달 열기
function showInfoModal(type) {
  let infoText = "";
  switch (type) {
    case 'electricity':
      infoText = "채굴에 필요한 1시간의 kw 전력 소비 비용을 의미합니다.";
      break;
    case 'power':
      infoText = "장비가 채굴을 위해 사용하는 1시간의 kw 전기의 양입니다.";
      break;
    case 'hours':
      infoText = "하루 중 채굴하는 시간을 설정합니다.";
      break;
    case 'fee':
      infoText = "채굴 풀에서 부과하는 수수료입니다.";
      break;
    case 'hardware_cost':
      infoText = "채굴에 필요한 장비에 투자한 가격입니다.";
      break;
    default:
      infoText = "정보를 불러올 수 없습니다.";
  }

  const modal = document.getElementById("infoModal");
  document.getElementById("infoText").textContent = infoText;
  modal.classList.add("show");
}

// 설명 모달 닫기
function closeInfoModal() {
  document.getElementById("infoModal").classList.remove("show");
}