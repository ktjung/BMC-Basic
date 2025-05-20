async function fetchBTCPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await res.json();
  return data.bitcoin.usd;
}

function getHashrateUnit() {
  return document.querySelector('input[name="hashrate_unit"]:checked').value;
}

async function calculate() {
  const hashrate = parseFloat(document.getElementById("hashrate").value);
  const powerRate = parseFloat(document.getElementById("power").value);
  const electricity = parseFloat(document.getElementById("electricity").value);
  const feePercent = parseFloat(document.getElementById("fee").value);
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

  document.getElementById("btc_price").textContent = btcPrice.toFixed(2);
  document.getElementById("daily_btc").textContent = dailyBTC.toFixed(8);
  document.getElementById("monthly_btc").textContent = (dailyBTC * 30).toFixed(8);
  document.getElementById("yearly_btc").textContent = (dailyBTC * 365).toFixed(8);
  document.getElementById("daily_rev").textContent = revenueAfterFee.toFixed(2);
  document.getElementById("daily_cost").textContent = dailyCost.toFixed(2);
  document.getElementById("daily_profit").textContent = dailyProfit.toFixed(2);

  document.getElementById("output").classList.add("show");
}

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

function closeInfoModal() {
  document.getElementById("infoModal").classList.remove("show");
}
