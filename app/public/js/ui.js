function populateKeySelectors(resource_data_list) {
  available_fields = getAvailableFields(resource_data_list);

  // Old way
  $('.key-selector').empty();
  $('.key-selector').append('<option value="" selected=selected>None</option>');
  $.each(available_fields, function(i,e) {

    // Old Way
    $('.key-selector').append('<option value="'+e+'">'+e+'</option>');

    // New Way
    // $('#wt_options').append('<li item_value="ready"><a>aws.test</a></li>')
  });

  // Set default keys
  setViaCookie = false;
  document.cookie.split(';').forEach(function(v,k) {
    if(v.trim().startsWith("key")) {
      setViaCookie = true;
      parts = v.trim().split("=");
      // console.log("setting "+parts[0]+" to "+parts[1]+" from cookie")
      $('#'+parts[0]).val(parts[1]);
    } else if(v.trim().startsWith("filter")) {
      filterValue = v.trim().slice(7); // remove filter= from start of string
      // console.log("setting filter to "+filterValue+" from cookie")
      $('#wt_filter').val(filterValue);
    }
  });
  if(!setViaCookie) {
    $('#key1').val('aws.region.name');
    $('#key2').val('kops.cluster.name');
  }
  // $('#key3').val('aws.instance.id');
  // $('#key4').val('aws.instance.id');

  $('.key-selector').selectize({});
}

// Returns an array of field names in order by key
// Skips empty fields
function getKeyList() {
  keys = [];
  i = 1;
  $('.menuoptions select').each(function(index) {
    var selection = $(this).find('option:selected').val();
    if(selection) {
      document.cookie = "key"+i+"="+selection
      keys.push(selection);
      i++;
    }
  });
  return keys;
}

function makeDescription(data) {
  var description = '<div><div class="Rtable Rtable--2cols">'
  for(key in data) {
    val = data[key]
    if(val === undefined) {
      val = "N/A"
    } else if(Array.isArray(val)) {
      val = _.uniq(val).join("<br>");
    }
    description = description + '<div class="Rtable-cell cell-head">'+key+': </div>';
    description = description + '<div class="Rtable-cell">'+val+'</div>';
  }
  description = description + '</div></div>'

  return description
}


function collapseTree(depth) {

}
