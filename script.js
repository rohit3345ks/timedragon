const fiveHoursThirtyMinsInMS = 19800000;
const eightHours = 28800000;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams?.get('token') ?? "";
let empId = urlParams?.get('empId') ?? "";

const devDirectionText = {
  IN: 'You came in',
  OUT: 'You went out'
};

const fetchAndProcessPunches = async () => {
  var myHeaders = new Headers();
  myHeaders.append(
    "sec-ch-ua",
    '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"'
  );
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append(
    "authorization",
    token
  );
  myHeaders.append(
    "User-Agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
  );
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Accept", "application/json, text/plain, */*");
  myHeaders.append("Referer", "https://timedragon.chicmic.in/");
  myHeaders.append("sec-ch-ua-platform", '"macOS"');

  var raw = JSON.stringify({
    empId,
    date: moment().format("YYYY-MM-DD"),
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const punchesResponse = await fetch(
    "https://apigateway.erp.chicmic.in/v1/biometric/punches",
    requestOptions
  );
  let punches = await punchesResponse.json();
  processPunchesAndShowInUI(punches.data);
};

const getTwoDigitFormat = (value) => {
  return value < 10 ? `0${value}` : value;
};

const formatDuration = (duration) => {
  // in milliseconds
  const momentDuration = moment.duration(duration);
  return `${getTwoDigitFormat(momentDuration.hours())}:${getTwoDigitFormat(momentDuration.minutes())}:${getTwoDigitFormat(momentDuration.seconds())}`;;
};

const formatTime = (timeString) => {
  const momentTime = moment.utc(timeString);
  return momentTime.format('hh:mm:ss A');
};

const processPunchesAndShowInUI = (punches = []) => {
  const lastEntry = {
    attPunchRecDate: moment().toString().replace("+0530", "+0000"),
    devDirection: "OUT",
  };
  punches.push(lastEntry);

  let inTime = 0;
  let outTime = 0;

  for (let i = 0; i < punches.length - 1; i++) {
    let adjancentTimeDifference = moment(punches[i + 1].attPunchRecDate).diff(
      moment(punches[i].attPunchRecDate)
    );
    let sign = "";
    if (
      punches[i].devDirection === "IN" &&
      punches[i + 1].devDirection === "OUT"
    ) {
      inTime += adjancentTimeDifference;
    }

    if (
      punches[i].devDirection === "OUT" &&
      punches[i + 1].devDirection === "IN"
    ) {
      outTime += adjancentTimeDifference;
    }
    punches[i + 1] = {
      ...punches[i + 1],
      timeDifference: `${formatDuration(adjancentTimeDifference)}`,
    };
  }

  const inDuration = moment.duration(inTime);
  const outDuration = moment.duration(outTime);

  const totalDuration = inDuration + outDuration;
  const momentStartTime = moment.utc(punches[0].attPunchRecDate);
  console.log("Start Time:", momentStartTime.format("HH:mm:ss"));
  console.log("In Duration:", formatDuration(inDuration));
  console.log("Out Duration:", formatDuration(outDuration));
  console.log("Total Duration:", formatDuration(totalDuration));
  const timeTillNow = moment().diff(moment(punches[0].attPunchRecDate));
  console.log(
    "Time till Now:",
    formatDuration(timeTillNow + fiveHoursThirtyMinsInMS)
  );
  const timeLeft = eightHours - inDuration;
  console.log(moment().add(timeLeft, "milliseconds"));
  const timeStats = {
    in_duration: formatDuration(inDuration),
    time_left: formatDuration(timeLeft),
    complete_by: formatTime(moment().add(timeLeft, "milliseconds").toString()),
    out_duration: formatDuration(outDuration),
    start_time: momentStartTime.format("HH:mm:ss"),
    total_duration: formatDuration(totalDuration),
    time_from_start: formatDuration(timeTillNow + fiveHoursThirtyMinsInMS),
  };
  console.log(punches, "punches");
  showInUI(punches, timeStats);
};

const showInUI = (punches, timeStats) => {
  Object.keys(timeStats).forEach((key) => {
    document.querySelector(`#${key} > b`).innerHTML = timeStats[key];
  });

  punches.forEach((punch, index) => {
    if (index === punches.length - 1) return;
    const row = document.createElement("tr");
    const timeCell = document.createElement("td");
    timeCell.textContent = formatTime(punch.attPunchRecDate);
    const statusCell = document.createElement("td");
    statusCell.textContent = devDirectionText[punch.devDirection];
    const timeDiffCell = document.createElement("td");
    timeDiffCell.textContent = `after ${punch?.timeDifference ?? "0:00:00"}`;
    row.appendChild(timeCell);
    row.appendChild(statusCell);
    row.appendChild(timeDiffCell);
    document.querySelector("table").appendChild(row);
  });
};

fetchAndProcessPunches();
