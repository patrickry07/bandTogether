
import React from 'react'
import Axios from 'axios';


class Map extends React.Component{

constructor(props){
  super(props)

  this.state = {
    listings: [],
    centerOfUs: [39.8283, -98.5795],
    map: ''
  }

this.getCoordinates = this.getCoordinates.bind(this);
this.getMap = this.getMap.bind(this);
}

componentDidMount(){
  //this.getMap()
  console.log(this.props);
  this.setState({
    listings: this.props.listings
  })

  let listings = this.props.listings;

  const script = document.createElement('script');
  script.src = 'sdk/tomtom.min.js'; 
  document.body.appendChild(script);
  script.async = true;
  script.onload = function(){


   // navigator.geolocation.getCurrentPosition( position => {
     // console.log(position.coords.latitude, position.coords.longitude);
      
    const userLatitude =  29.9511;
    const userLongitude = -90.0715;
      
      const map =  window.tomtom.L.map('map', {
      key: 'pcm5jnIlZGFDyxHe5t8sQKodDJhrd6FL',
      basePath: 'sdk',
      center: [userLatitude, userLongitude],
      zoom: 12
    });

    Axios.get('/listings')
      .then((listings) => {
        listings.data.forEach( listing => {
          let marker = tomtom.L.marker([listing.latitude, listing.longitude]).addTo(map);
          marker.bindPopup(`<b>${listing.title}</b><br />${listing.date} <br /> ${listing.description}`);
        })
      }).catch((err) => {
        console.error(err);
      });

    //})


  }




}


getMap(){

// Axios.get('/geolocation/map')
//   .then((response) => {
//     console.log(response);
//     this.setState({
//       map: ''
//     })
//   }).catch((err) => {
//     console.log(err);
//   });

}


getCoordinates(){


}


render() {


  return(
    <div>
      Hello
    <div id="map">
    </div>
    </div>
    
  )
}




}

export default Map;