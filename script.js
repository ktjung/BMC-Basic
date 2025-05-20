// BTC 가격을 가져오는 함수
async function fetchBTCPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await res.json();
  return data.bitcoin.usd;
}

// 해시레이트 단위 확인
function getHashrateUnit() {
  return document.querySelector('input[name="hashrate_unit"]:checked').value;
}

// 채굴 수익 계산
async function calculate() {
  const hashrate = parseFloat(document.getElementById("hashrate").value);
  const powerRate = parseFloat(document.getElementById("power").value);
  const electricity = parseFloat(document.getElementById("electricity").value);
  const feePercent = parseFloat(document.getElementById("fee").value);
  const hours = parseFloat(document.getElementById("hours").value);

  const btcPrice = await fetchBTCPrice(); // BTC 가격 가져오기
  const blockRewardBTC = 3.125; // 블록 보상
  const totalNetworkDailyBTC = 462; // 하루 전체 네트워크 채굴량 (450 + 거래 수수료 12개)
  const networkHashrate = 867000000; // 전체 네트워크 해시레이트 (867EH/s)

  let userHashrate = hashrate;
  const unit = getHashrateUnit();
  if (unit === "GH/s") userHashrate *= 0.001; // GH/s -> TH/s
  if (unit === "MH/s") userHashrate *= 0.000001; // MH/s -> TH/s

  const userHashrateHps = userHashrate * 1e12; // 사용자의 해시레이트 (TH/s -> H/s 변환)

  // 채굴량 계산
  let dailyBTC = totalNetworkDailyBTC * (userHashrateHps / (networkHashrate * 1e12));

  // 풀 수수료를 반영한 채굴량 계산
  const dailyBTCWithFee = dailyBTC * (1 - feePercent / 100);

  // 수익 계산 (BTC -> USD)
  const revenueBeforeFee = dailyBTCWithFee * btcPrice;
  const revenueAfterFee = revenueBeforeFee;

  // 전기세 계산
  const powerInKW = powerRate * userHashrate;
  const dailyCost = powerInKW * hours * electricity;
  
  // 하루 이익 계산
  const dailyProfit = revenueAfterFee - dailyCost;

  // 결과 출력
  document.getElementById("btc_price").textContent = btcPrice.toFixed(2);
  document.getElementById("daily_btc").textContent = dailyBTCWithFee.toFixed(8);
  document.getElementById("monthly_btc").textContent = (dailyBTCWithFee * 30).toFixed(8);
  document.getElementById("yearly_btc").textContent = (dailyBTCWithFee * 365).toFixed(8);
  document.getElementById("daily_rev").textContent = revenueAfterFee.toFixed(2);
  document.getElementById("daily_cost").textContent = dailyCost.toFixed(2);
  document.getElementById("daily_profit").textContent = dailyProfit.toFixed(2);
  document.getElementById("roi").textContent = currentROI ? currentROI : "수익 없음";

  // 결과 애니메이션
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
