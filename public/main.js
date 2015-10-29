var React = require('react');
var ReactDOM = require('react-dom');
var YouTube = require('react-youtube');

var url = '';


const opts = {
  height: '300',
  width: 'auto',
  playerVars: { // https://developers.google.com/youtube/player_parameters 
    autoplay: 1
  }
}


const optsNext = {
  height: 'auto',
  width: 'auto',
  playerVars: { // https://developers.google.com/youtube/player_parameters 
    autoplay: 0
  }
}


function onEnd () {
  ReactDOM.render(
    <YouTube url={url} opts={opts} onEnd={onEnd}  />,
    document.getElementById('mount-point')
  );

  url = "";

  $.ajax({
    type: "POST",
    url: "/nextVideo",
    data: {"url": url},
    success: function(data) 
    {
      $.ajax({
        type: "GET",
        url: "/current",
        success: function(data) 
        {
          data = JSON.parse(data);
          console.log(data);
          if (data.current)
            ReactDOM.render(
              <YouTube url={data.current} opts={opts} onEnd={onEnd}  />,
              document.getElementById('mount-point')
            );
            url = "";
            ReactDOM.render(
              <YouTube url={url} opts={optsNext} />,
              document.getElementById('mount-point-next')
            ); 
        }
      });
    }
  });

}


$('#nextVideoUpdate').click(function() {
  url = $('#nextVideo').val();


  $.ajax({
    type: "POST",
    url: "/nextVideo",
    data: {"url": url},
    success: function(data) 
    {
      $.ajax({
        type: "GET",
        url: "/current",
        success: function(data) 
        {
          data = JSON.parse(data);
          console.log(data);
          if (data.current)
            ReactDOM.render(
              <YouTube url={data.current} opts={opts} onEnd={onEnd}  />,
              document.getElementById('mount-point')
            );
          if (data.next) {
              url = data.next;
              ReactDOM.render(
                <YouTube url={url} opts={optsNext} />,
                document.getElementById('mount-point-next')
              );
          }
        }
      });
    }
  });


});

$('#update').click(function() {
  $.ajax({
  type: "GET",
  url: "/current",
  success: function(data)
  {
    data = JSON.parse(data);
    if (data.current)
      ReactDOM.render(
        <YouTube url={data.current} opts={opts} onEnd={onEnd}  />,
        document.getElementById('mount-point')
      ); 
    else {
      ReactDOM.render(
        <YouTube url="" opts={opts} onEnd={onEnd}  />,
        document.getElementById('mount-point')
      ); 

    }
    if (data.next) {
      url = data.next;
        ReactDOM.render(
          <YouTube url={url} opts={optsNext} />,
          document.getElementById('mount-point-next')
        );
    } else {
        ReactDOM.render(
          <YouTube url="" opts={optsNext} />,
          document.getElementById('mount-point-next')
        );
    }
  }
});
});

$.ajax({
  type: "GET",
  url: "/current",
  success: function(data)
  {
    data = JSON.parse(data);
    if (data.current)
      ReactDOM.render(
        <YouTube url={data.current} opts={opts} onEnd={onEnd}  />,
        document.getElementById('mount-point')
      );
    if (data.next) {
      url = data.next;
        ReactDOM.render(
          <YouTube url={url} opts={optsNext} />,
          document.getElementById('mount-point-next')
        );
    }
  }
});



