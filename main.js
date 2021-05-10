const divContainer = document.getElementById("container");
const monthlyAvailableContainer = document.getElementById("monthly-available");
const oneTimeAvailableContainer = document.getElementById("one-time-available");
const donorTable = document.getElementById("header-row");
const oneTimeDonorTable = document.getElementById("one-time-donor-header-row");

function displayRecurringData(value) {
    let div = document.createElement("div");
    div.setAttribute('class', 'bold');
    div.innerHTML = `$${value}`;
    monthlyAvailableContainer.appendChild(div);
};

function displayOneTimeData(value) {
  let div = document.createElement("div");
  oneTimeAvailableContainer.appendChild(div);
  div.setAttribute('class', 'bold');
  div.innerHTML = `$${value}`;
};

function createTableCell(element, info) {
  let newCell = document.createElement(element);
  newCell.innerHTML = info;
  return newCell;
};

function formatDonorInfo(spreadSheet, column_letter,i){
  let address = column_letter + i;
  let value = spreadSheet[address];
  let value_text = (value ? value.v : undefined);
  let text_cell = createTableCell("td", value_text);
  return text_cell;
}

function getDonorInfo(i, spreadSheet, donor_info_array) {
  // name in cell K, email in cell L, phone in cell S
  // one-time: name in cell J, email in cell T, phone in cell S, donation in C

    let donation_cell = formatDonorInfo(spreadSheet, 'F', i);
    let name_cell = formatDonorInfo(spreadSheet, 'K', i);
    let email_cell = formatDonorInfo(spreadSheet, 'L', i);
    let phone_cell = formatDonorInfo(spreadSheet, 'S', i);

    let one_time_donation = formatDonorInfo(spreadSheet, 'C', i);
    let one_time_name = formatDonorInfo(spreadSheet, 'J', i);
    let one_time_email = formatDonorInfo(spreadSheet, 'T', i);
    let one_time_phone = formatDonorInfo(spreadSheet, 'S', i);

    let one_time_donor_info = {
      one_time_donation,
      one_time_name,
      one_time_email,
      one_time_phone,
    };

    let recurring_donor_info = {
      donation_cell,
      name_cell,
      email_cell,
      phone_cell,
    };
    
    let identifying_address = 'A' + 1;

    if (spreadSheet[identifying_address].v === "Recurring Gift Records") {
      if (name_cell.innerHTML != "undefined") {
        donor_info_array.push(recurring_donor_info);
      };
    } else {
      if (one_time_name.innerHTML != "undefined"){
        donor_info_array.push(one_time_donor_info);
      };
    };
};


function addDonorsToTable(donor_array) {
  donor_array.forEach((donor)=>{
    let table_row = document.createElement("tr");
    donorTable.after(table_row);
    table_row.appendChild(donor.name_cell);
    let donation = document.createElement('td');
    let donation_value = donor.donation_cell.innerHTML - (donor.donation_cell.innerHTML * .03);
    donation.innerHTML = `$${donation_value}`;
    donation.setAttribute('class', 'bold');
    donor.name_cell.after(donation);
    donation.after(donor.email_cell);
    donor.email_cell.after(donor.phone_cell);
  });
};

function addOneTimeDonorsToTable(donor_array){
  donor_array.forEach((donor)=>{
    let table_row = document.createElement("tr");
    oneTimeDonorTable.after(table_row);
    table_row.appendChild(donor.one_time_name);
    let donation = document.createElement('td');
    donation.innerHTML = `$${donor.one_time_donation.innerHTML}`;
    donation.setAttribute('class', 'bold');
    donor.one_time_name.after(donation);
    donation.after(donor.one_time_email);
    donor.one_time_email.after(donor.one_time_phone);
  });
};

function handleFile(e) {
    let files = e.target.files, f = files[0];
    let reader = new FileReader();

    /* if recurring */
    if (e.target.id === "recurring-file") {
      reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {type: 'array'});
        
        /* DO SOMETHING WITH workbook HERE */
        let sheet1 = workbook.SheetNames[0];
      
        /* Get worksheet */
        let worksheet = workbook.Sheets[sheet1];
      
        let modified_value_array = [];
        let donor_array = [];
        /* loop to get all the needed values*/
        for (let i = 3; i< 1000; i++) {
          getDonorInfo(i, worksheet, donor_array);
        
          let address_of_cell = 'F' + i;
          let frequency = 0;
          let frequency_address = 'E' + i;
          let frequency_cell = worksheet[frequency_address];
          if (frequency_cell != undefined){
            if (frequency_cell.v === 'Monthly'){
              frequency = 1;
            } else if (frequency_cell.v === 'Weekly'){
              frequency = 4;
            } else {
              frequency = 2;
            };
          };

          /* Find desired cell */
          let desired_cell = worksheet[address_of_cell];
        
          /* Get the value */
          let desired_value = (desired_cell ? desired_cell.v : undefined);
        
          /* modify value with calculation*/
          if (desired_value != undefined) {
            let modified_value = (desired_value - (desired_value * .03)) * frequency;
            modified_value_array.push(modified_value);
          };
        };
        const value = modified_value_array.reduce((acc,value)=> acc + value);
        const finalValue = Math.round((value + Number.EPSILON) * 100) / 100;
        displayRecurringData(finalValue);
        addDonorsToTable(donor_array);
      };
     } else {
        reader.onload = function(e) {
          let data = new Uint8Array(e.target.result);
          let workbook = XLSX.read(data, {type: 'array'});
          
          /* DO SOMETHING WITH workbook HERE */
          let sheet1 = workbook.SheetNames[0];
        
          /* Get worksheet */
          let worksheet = workbook.Sheets[sheet1];
          /*calculations for one-time*/
          let one_time_value_array = [];
          let donor_array = [];
          for (let i = 3; i < 1000; i++) {
            getDonorInfo(i, worksheet, donor_array);
            let address_of_cell = 'C' + i;
            let desired_cell = worksheet[address_of_cell];
            let desired_value = (desired_cell ? desired_cell.v : undefined);
            if (desired_value != undefined) {
              one_time_value_array.push(desired_value);
            };
          };
          const one_time_value = one_time_value_array.reduce((acc, value)=>acc+value);
          const finalValue = Math.round((one_time_value + Number.EPSILON) * 100) / 100;
          addOneTimeDonorsToTable(donor_array);
          displayOneTimeData(finalValue);
        };
      };

    reader.readAsArrayBuffer(f);
  }
const recurringBtn = document.getElementById("recurring-file");
recurringBtn.addEventListener('change', handleFile, false);

const oneTimeBtn = document.getElementById("one-time-file");
oneTimeBtn.addEventListener('change', handleFile, false);