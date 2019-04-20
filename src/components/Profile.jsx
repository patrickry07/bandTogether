import React from 'react';
import ListView from './ListView';
import Comments from './Comments'
import WallModal from './WallModal'

class Profile extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { changeView, artists, listings, isLoggedIn, currentProfile, userProfile } = this.props;
    const profile = currentProfile;
    let events = listings.filter((listing) => {
      return (listing.artistId === profile.id)
    });
    
    return (
      <div className="jumbotron">
        <div>
          <div className="row">
            <div className='col-md-4'>
              <img className="img-fluid" alt="" style={{ maxHeight: "300px" }} src={profile.image_url}/><br />
              {userProfile === currentProfile && isLoggedIn && <button type="button" className="btn btn-secondary" onClick={() => {changeView('createprofile')}}>Edit Profile</button>}
            </div>
            <div className='col-md-8'>
              <div className="container">
                <div className="row">
                  <h1 className="display-4">{profile.name}</h1>
                </div>
                <div className="row">
                  <h6>City:&nbsp;</h6>{profile.city}
                </div>
                <div className="row">
                  <h6>Genre:&nbsp;</h6>{profile.genre}
                </div>
                <div className="row">
                  <h6>Bio:&nbsp;</h6>
                  <div className="container-fluid">{profile.bio}</div>
                </div>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-md-3'>
            <WallModal currentProfile={this.props.currentProfile} userProfile={userProfile}/>
              <h1 className="display-4">Links</h1>
              <div>
                <h3>Bandcamp:</h3>
                <a href={profile.bandcamp_url}>{profile.bandcamp_url}</a>
              </div>
              <div>
                <h3>Spotify:</h3>
                <a href={profile.spotify_url}>{profile.spotify_url}</a>
              </div>
              <div>
                <h3>Facebook:</h3>
                <a href={profile.facebook_url}>{profile.facebook_url}</a>
              </div>
              <div>
                <h3>Homepage:</h3>
                <a href={profile.homepage_url}>{profile.homepage_url}</a>
              </div>
            </div>
            <div className='col-md-9'>
              <ListView listings={events} artists={artists} isLoggedIn={isLoggedIn} userProfile={userProfile} />
            </div>
          </div>
        </div>
        <Comments currentProfile={this.props.currentProfile} userProfile={userProfile}></Comments>
      </div>
    )
  }
}


export default Profile;