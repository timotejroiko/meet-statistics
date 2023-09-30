function downloadCSV (data) {
  // Creating a Blob for having a csv file format 
  // and passing the data with type
  const blob = new Blob([data], { type: 'text/csv' });

  // Creating an object for downloading url
  const url = window.URL.createObjectURL(blob);

  // Creating an anchor(a) tag of HTML
  const a = document.createElement('a');

  // Passing the blob downloading url 
  a.setAttribute('href', url);

  // Setting the anchor tag attribute for downloading
  // and passing the download file name
  a.setAttribute('download', 'download.csv');

  // Performing a download with click
  a.click();
}
  
function csvBuilder(objsArray)  {
  // Empty array for storing the values
  const csvRows = [];

  // Headers is basically a keys of an
  // object which is id, name, and
  // profession
  const headers = Object.keys(objsArray[0]);

  // As for making csv format, headers 
  // must be separated by comma and
  // pushing it into array
  csvRows.push(headers.join(','));
  
  for (let dataObj of objsArray) {
    // Pushing Object values into array
    // with comma separation
    const values = Object.values(dataObj).join(',');
    csvRows.push(values);
  }

  // Returning the array joining with new line 
  return csvRows.join('\n');
}

function downloadJSON(data) {
  const filename = 'data.json';
  const jsonStr = JSON.stringify(data);

  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}