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
  $('#key1').val('kubernetes.container.name');
  $('#key2').val('kubernetes.service.name');
  // $('#key3').val('aws.instance.id');
  // $('#key4').val('aws.instance.id');

  $('.key-selector').selectize({});
}

// Returns an array of field names in order by key
// Skips empty fields
function getKeyList() {
  keys = [];
  $('.menuoptions select').each(function() {
    var selection = $(this).find('option:selected').val();
    if(selection) {
      keys.push(selection);
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
    }
    description = description + '<div class="Rtable-cell cell-head">'+key+': </div>';
    description = description + '<div class="Rtable-cell">'+val+'</div>';
  }
  description = description + '</div></div>'

  return description
}
