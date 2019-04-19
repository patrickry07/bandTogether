import React from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import axios from 'axios';
import { timingSafeEqual } from 'crypto';
// require('dotenv').config();
// const accountSid = process.env.ACCOUNTSID;
// const authToken = process.env.AUTHTOKEN;
// const client = require('twilio')(accountSid, authToken);


class ListItem extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      shown: false,
      contactInfo: {},
      bandData: {},
    };
    
    this.handleClick = this.handleClick.bind(this);
    this.profileClick = this.profileClick.bind(this);
    this.messageClick = this.messageClick.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  componentDidMount() {
    const bandData = this.props.artists.filter((artist) => {
      return (artist.id === this.props.listing.artistId);
    }).pop();
    this.setState({bandData});
  }

  /**
   * Changes the currentProfile state of the parent component to the profile of the listing clicked.
   * 
   * @param {Object} e The event object
   */
  profileClick(e) {
    e.preventDefault();
    this.props.changeProfile(this.state.bandData);
  }
  
  /**
   * Handles whenever a user clicks on the "Respond to this Listing" button.
   * Makes a request to the server to grab the contact info of the artist who made the posting.
   */
  handleClick() {
    if (!this.state.shown) {
      const { listing } = this.props;
      return axios.get(`/listings/contact?id=${listing.id}`)
        .then((response) => {
          const artistData = response.data;
          console.log(artistData,'artistData')
          const contactInfo = {
            email: artistData.contact_email,
            number: artistData.contact_num,
            name: artistData.name,
          }
          this.setState({contactInfo, shown: true});
        })
    } else {
      this.setState({contactInfo: {}, shown: false});
    }
  }
  //handles sending a message to event owner once im interested is clicked
  sendMessage(){
    client.messages
    .create({
       body: `Client has showed interest in your post on bandTogether for ${this.props.listing.title} , please contact ${this.state.contactInfo.name} asap!`,
       from: '+14044713243',
       to: '+16785926777'
     })
    .then(message => console.log(message.sid));
  }

  //handles the message being seen when client clicks on interested
  messageClick() {
    if (!this.state.shown) {
      const { listing } = this.props;
      return axios.get(`/listings/contact?id=${listing.id}`)
        .then((response) => {
          const artistData = response.data;
          console.log(artistData,'artistData')
          const contactInfo = {
            name: artistData.name,
          }
          this.sendMessage();
          this.setState({contactInfo, shown: true});
        })
    } else {
      this.setState({contactInfo: {}, shown: false});
    }
  }

  render() {
    const {listing, isLoggedIn} = this.props;
    const { contactInfo, bandData } = this.state;
    const popover = (
      <Popover id="popover-basic">
        {isLoggedIn && (
          <div>
            <ul>
              {contactInfo.email && <li>Email:&nbsp;{contactInfo.email}</li>}
              {contactInfo.number && <li>Number:&nbsp;{contactInfo.number}</li>}
            </ul>
          </div>
        )}
        {!isLoggedIn && "Must be logged in to view contact info!"}
      </Popover>
    )
    const popoverMssg = (
      <Popover id="popover-basic">
        {isLoggedIn && (
          <div>
            <ul>
              {contactInfo.name && <li>You have successfully notified &nbsp;{contactInfo.name} your interest!</li>}
            </ul>
          </div>
        )}
        {!isLoggedIn && "Must be logged in to send confirmation!"}
      </Popover>
    )
   
    return (
    <div className="list-group-item bg-light" >
      <div className="row d-flex w-100 justify-content-between">
        <div className="col-md-3 flex-grow-1">
          <img className="img-fluid" alt="" style={{maxHeight: '180px', maxWidth: '180px'}} src={listing.image_url} />
        </div>
        <div className="col-md-4 flex-grow-1">
          <h3>{listing.title}</h3>
          <p className="text-body">{listing.description}</p>
        </div>
        <div className="col-md-3 flex-grow-1">
          <div className="row"><h6>Poster:&nbsp;</h6><a href="#!" onClick={this.profileClick}>{bandData.name}</a></div>
          <div className="row"><h6>Type:&nbsp;</h6>{listing.type}</div>
          <div className="row"><h6>City:&nbsp;</h6>{bandData.city}</div>
          <div className="row"><h6>Genre:&nbsp;</h6>{bandData.genre}</div>
          <div className="row"><h6>Venue:&nbsp;</h6>{listing.venue}</div>
          <div className="row"><h6>Date:&nbsp;</h6>{listing.date}</div>
        </div>
        <div className="col-md-2 flex-grow-1">
          <OverlayTrigger trigger="click" placement="bottom" overlay={popover}>
            <button type="button" onClick={this.handleClick} className="btn btn-secondary">Contact Information</button>
          </OverlayTrigger>
        </div>
        <div className="col-md-5 flex-grow-1">
          <OverlayTrigger trigger="click" placement="bottom" overlay={popoverMssg}>
            <button type="button" onClick={this.handleClick} className="btn btn-secondary">Click here if Interested!</button>
          </OverlayTrigger>
        </div>
      </div>
    </div>
    )
  }
} 
export default ListItem;