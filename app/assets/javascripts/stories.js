$(function() {

  if ($("body.stories").length == 0) return;

  drawingManager = {},
  loadedFeature  = null;

  var uploadsIds = [], drawingManager, selectedShape, selectedMarker, selectedColor, filesAdded = 0;

  if ($("#story_uploads_ids").length > 0) {
    uploadsIds = _.compact($("#story_uploads_ids").val().split(","));
  }


  var modelDialog = new gfw.ui.model.Dialog({
    title: "Are you sure?",
    accept: "Yes, delete it",
    cancel: "No, let’s keep it"
  });

  var Dialog = new gfw.ui.view.Dialog({ model: modelDialog });

  $("body").append(Dialog.render());

  $("a.destroy_story").on("click", function(e) {
    e.preventDefault();
    e.stopPropagation();

    var
    $a  = $(this),
    url = $(this).attr("href");

    var callback =  function() {
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(result) {
          window.location = '/stories';
        }
      });
    };

    Dialog.show();
    Dialog.model.set("callback", callback);


  });

  $("a.destroy").on("click", function(e) {

    e.preventDefault();
    e.stopPropagation();

    var
    $a  = $(this),
    url = $(this).attr("href");

    var confirmation = confirm("Are you sure?")

    if (confirmation == true) {

      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(result) {

          uploadsIds = _.without(uploadsIds, getFilename(url));
          $("#story_uploads_ids").val(uploadsIds.join(","));

          $a.parent().fadeOut(250, function() {
            $(this).remove();
          });

        }
      });
    }
  });

  function setupZoom() {
    var overlayID =  document.getElementById("zoom_controls");
    // zoomIn
    var zoomInControlDiv = document.createElement('DIV');
    overlayID.appendChild(zoomInControlDiv);

    var zoomInControl = new zoomIn(zoomInControlDiv, map);
    zoomInControlDiv.index = 1;

    // zoomOut
    var zoomOutControlDiv = document.createElement('DIV');
    overlayID.appendChild(zoomOutControlDiv);

    var zoomOutControl = zoomOut(zoomOutControlDiv, map);
    zoomOutControlDiv.index = 2;
  }

  function zoomIn(controlDiv, map) {
    controlDiv.setAttribute('class', 'zoom_in');

    google.maps.event.addDomListener(controlDiv, 'mousedown', function() {
      var zoom = map.getZoom() + 1;
      if (zoom < 20) {
        map.setZoom(zoom);
      }
    });
  }

  function zoomOut(controlDiv, map) {
    controlDiv.setAttribute('class', 'zoom_out');

    google.maps.event.addDomListener(controlDiv, 'mousedown', function() {
      var zoom = map.getZoom() - 1;

      if (zoom > 2) {
        map.setZoom(zoom);
      }

    });
  }

  function showFeature(geojson, style){

    feature = new GeoJSON(geojson, style || null);

    if (feature.type && feature.type == "Error"){
      return;
    }

    drawingManager.setOptions({ drawingControl: false });
    drawingManager.setDrawingMode(null);
    $(".remove").fadeIn(250);

    var bounds = new google.maps.LatLngBounds();

    if (feature.length > 0) {

      feature[0].setMap(map);

      loadedFeature        = feature[0];
      window.loadedFeature = loadedFeature;

      _.each(loadedFeature.latLngs, function(latlng) {

        var latlngs = loadedFeature.latLngs.getAt(0);

        latlngs.forEach(function(position) {
          var point = new google.maps.LatLng(position.lat(), position.lng());
          bounds.extend(point);
        });

      });

    } else {
      feature.setMap(map);
      loadedFeature = feature;
      bounds.extend(loadedFeature.position);
    }

    map.fitBounds(bounds);

    setTimeout(function() {
      map.setZoom(2);
    }, 250);

  }

  function clearSelection() {

    if (selectedShape) {

      selectedShape       = null;
      drawingManager.path = null;
    }

  }

  function remove() {

    deleteSelectedShape();
    deleteSelectedMarker();

    drawingManager.setOptions({ drawingControl: true });
    drawingManager.path = null;
    $the_geom.val("");

    if (loadedFeature) {
      loadedFeature.setMap(null);
    }

    $(".remove").fadeOut(250);
  }

  function setSelection(shape) {
    clearSelection();
    selectedShape = shape;
    selectColor(shape.get('fillColor') || shape.get('strokeColor'));
  }

  function deleteSelectedMarker() {
    if (selectedMarker) {
      selectedMarker.setMap(null);
    }
  }

  function deleteSelectedShape() {
    if (selectedShape) {
      selectedShape.setMap(null);
    }
  }

  function selectColor(color) {
    selectedColor = color;

    var polygonOptions = drawingManager.get('polygonOptions');
    polygonOptions.fillColor = color;
    drawingManager.set('polygonOptions', polygonOptions);
  }

  function setSelectedShapeColor(color) {
    if (selectedShape) {
      if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
        selectedShape.set('strokeColor', color);
      } else {
        selectedShape.set('fillColor', color);
      }
    }
  }

  $('.thumbnails').sortable({
    tolerance: "pointer",
    items: 'li.sortable',
    opacity: 0.4,
    scroll: true,
    update: function(){
      var order = $('.thumbnails').sortable('serialize', { key: 'string' } );
      order = order.replace(/string=/g, "").split("&")
      $("#story_uploads_id").val(order);
    }
  });

  if ($("#stories_map.stories_map").length > 0) {

    $(".upload_picture").on("click", function(e) {
      e.preventDefault();
      $("#fileupload").click();
    });

    $('#fileupload').fileupload({
      dataType: 'json',

      added: function (e, data) { },
      drop:  function (e, data) { },

      progress: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        //console.log("p", progress + '%');
      },

      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        //console.log(progress + '%');
      },

      add: function (e, data) {
        var files = data.files;

        filesAdded += _.size(data.files);

        _.each(data.files, function(file) {

          var filename = prettifyFilename(file.name);
          var $thumbnail = $("<li class='thumbnail preview' data-name='"+filename+"' />");

          $(".thumbnails").append($thumbnail);
          $thumbnail.fadeIn(250);

          var opts = {
            lines: 11, // The number of lines to draw
            length: 0, // The length of each line
            width: 4, // The line thickness
            radius: 9, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            color: '#9EB741', // #rgb or #rrggbb
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: 'auto', // Top position relative to parent in px
            left: 'auto' // Left position relative to parent in px
          };
          var spinner = new Spinner(opts).spin();
          $thumbnail.append($(spinner.el));
          $thumbnail.append("<div class='filename'>"+ file.name.truncate(18) +"</div>");
        });

        $("form input[type='submit']").addClass("disabled");
        $("form input[type='submit']").attr("disabled", "disabled");
        $("form input[type='submit']").val("Please wait...");

        data.submit();

      },

      done: function (e, data) {

        $.each(data.result, function (index, file) {
          filesAdded--;

          uploadsIds.push(file.cartodb_id);

          var url = file.thumbnail_url.replace("https", "http");
          var $thumb = $("<li id='photo_" + file.cartodb_id + "' class='sortable thumbnail'><div class='inner_box'><img src='"+url+"' /></div><a href='#' class='destroy'></a></li>");

          $thumb.find(".destroy").on("click", function(e) {

            e.preventDefault();
            e.stopPropagation();

            var confirmation = confirm("Are you sure?")

            if (confirmation == true) {
              $.ajax({
                url: '/media/' + file.cartodb_id,
                type: 'DELETE',
                success: function(result) {

                  uploadsIds = _.without(uploadsIds, file.cartodb_id);
                  $("#story_uploads_ids").val(uploadsIds.join(","));

                  $thumb.fadeOut(250, function() {
                    $thumb.remove();
                  });

                }
              });
            }

          });

          var filename = prettifyFilename(getFilename(file.image_url));

          $(".thumbnail[data-name='"+filename+"']").fadeOut(250, function() {
            $(this).remove();

            $(".thumbnails").append($thumb);
            $thumb.fadeIn(250);
          });


        });


        if (filesAdded <= 0) {
          $("form input[type='submit']").val("Submit story");
          $("form input[type='submit']").removeClass("disabled");
          $("form input[type='submit']").attr("disabled", false);
        }

        $("#story_uploads_ids").val(uploadsIds.join(","));
      }

    });

    var $the_geom = $('#story_the_geom');

    var map = new google.maps.Map(document.getElementById("stories_map"), {
      zoom: 4,
      center: new google.maps.LatLng(-34.397, 150.644),
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      disableDefaultUI:   true,
      panControl:         false,
      zoomControl:        false,
      mapTypeControl:     false,
      scaleControl:       false,
      streetViewControl:  false,
      overviewMapControl: false
    });

    setupZoom();

    // Creates a drawing manager attached to the map that allows the user to draw markers, lines, and shapes.
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.MARKER],
      markerOptions: {
        draggable: false,
        icon: new google.maps.MarkerImage(
          '/assets/icons/marker_exclamation.png',
          new google.maps.Size(45, 45), // desired size
          new google.maps.Point(0, 0), // offset within the scaled sprite
          new google.maps.Point(20, 20) // anchor point is half of the desired size
        )
      },
      drawingControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.MARKER]
      },

      polygonOptions: config.OVERLAYS_STYLE,
      map: map
    });

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
      if (e.type != google.maps.drawing.OverlayType.MARKER) {
        // Switch back to non-drawing mode after drawing a shape.
        drawingManager.setDrawingMode(null);
        drawingManager.path = e.overlay.getPath().getArray();

        $(".remove").fadeIn(250);

        drawingManager.setOptions({drawingControl: false});

        // Add an event listener that selects the newly-drawn shape when the user
        // mouses down on it.
        var newShape = e.overlay;
        newShape.type = e.type;
        setSelection(newShape);

        $the_geom.val(JSON.stringify({
          "type": "MultiPolygon",
          "coordinates": [
            [
              $.map(drawingManager.path, function(latlong, index) {
                return [[latlong.lng(), latlong.lat()]];
              })
            ]
          ]
        }));

      } else {

        drawingManager.setDrawingMode(null);

        $(".remove").fadeIn(250);

        drawingManager.setOptions({drawingControl: false});

        selectedMarker = e.overlay;

        $the_geom.val(JSON.stringify({
          "type": "Point",
          "coordinates": [ selectedMarker.position.lng(), selectedMarker.position.lat() ]
        }));

      }

    });

    var the_geom = $('#story_the_geom').val();

    if (the_geom) {
      showFeature(JSON.parse(the_geom), config.OVERLAYS_STYLE);
    }

    // Clear the current selection when the drawing mode is changed, or when the map is clicked
    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);

    $('.remove').on("click", function(e){
      e.preventDefault();
      remove();
    });

  }

});
