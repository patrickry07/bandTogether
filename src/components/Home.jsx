import React from 'react';
import ListView from './ListView.jsx'
import Search from './Search.jsx';
import ListingForm from './ListingForm';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Map from './Map.jsx'


const popover = (
  <Popover id="popover-basic">
      Must be logged in to create a listing!
  </Popover>
)
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showForm: false,
      showSearch: false,
      city: '',
      sort: 'date',
      listings: props.listings,
    };

    this.toggleForm = this.toggleForm.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.setSort = this.setSort.bind(this);
  }

  componentDidUpdate(prevProp, prevState, snapshot) {
    if(prevProp.listings !== this.props.listings) {
      this.setSort(this.state.sort);
    }
  }

  /**
   * Sets what the listings are sorted by.
   * 
   * @param {String} sort A string representing what to sort by.
   */
  setSort(sort) {
    const artistAddedListings = this.props.listings.map(listing => {
      const listingArtist = this.props.artists.reduce((seed, artist) => artist.id === listing.artistId ? artist : seed);
      listing.artistName = listingArtist.name;
      listing.genre = listingArtist.genre || '';
      return listing;
    })
    let sortProperty, listings;
    if(sort === 'date') {
      listings = artistAddedListings.sort((a, b) => {
        // the date is a string like so: '<year>-<month>-<day>'.
        // this function splits the date and checks to see what events will come first in order to return a sort value.
        const aArray = a.date.split('-');
        const bArray = b.date.split('-');
        if(aArray[0] === bArray[0]) {
          if(aArray[1] === bArray[1]) {
            if (aArray[2] > bArray[2]) {
              return 1;
            }
          } else if (aArray[1] > bArray[1]) {
            return 1;
          }
        } else if (aArray[0] > bArray[0]) {
          return 1;
        }
        return -1;
      });
    } else {
      if(sort === 'event name') {
        sortProperty = 'title';
      }
      if(sort === 'band name') {
        sortProperty = 'artistName';
      }
      if(sort === 'genre') {
        sortProperty = 'genre';
      }
      listings = artistAddedListings.sort((a, b) => a[sortProperty].toUpperCase() > b[sortProperty].toUpperCase() ? 1 : -1)
    }
    this.setState({
      sort,
      listings,
    })
  }

  /**
   * Toggles the Search component.
   */
  toggleSearch() {
    const currentState = this.state.showSearch;
    this.setState({
      showSearch: !currentState,
    });
  }

  /**
   * Toggles the Submit Listing form component.
   */
  toggleForm() {
    const currentState = this.state.showForm;
    this.setState({
      showForm: !currentState,
    });
  }

  render() {
    const { artists, isLoggedIn, handleNewListing, changeProfile, filters, setSearchCityValue, searchCityValue, userProfile } = this.props;
    const { listings, showForm, showSearch, sort } = this.state;
    return (
      <div className="jumbotron">
        <div className='row justify-content-center'>
          <img src='https://i.imgur.com/VvaYR3a.png' alt="Band Together"/>
        </div>
        <div className="row">
          <div className="col-md-12" style={{marginBottom: "20px"}}>
            {!showSearch && <button className="btn btn-dark btn-lg btn-block" type="button" onClick={this.toggleSearch}>Search Settings</button>}
            {showSearch && <Search toggleSearch={this.toggleSearch} filters={filters} searchCityValue={searchCityValue} setSearchCityValue={setSearchCityValue} setFilters={this.props.setFilters} setSort={this.setSort} sort={sort}/>}
            {!isLoggedIn && (
              <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                <button className="btn btn-dark btn-lg btn-block" type="button">Create a Listing</button>
              </OverlayTrigger>
            )}
            {isLoggedIn && 
              ((!showForm && <button className="btn btn-dark btn-lg btn-block" type="button" onClick={this.toggleForm}>Create a Listing</button>)
              ||
              (showForm && <ListingForm handleNewListing={handleNewListing} toggleForm={this.toggleForm} />))
            }
          </div>
        </div>
            <div id="map-div">
            <Map listings={listings} />
            </div>
        <div className="row">
          <ListView changeProfile={changeProfile} isLoggedIn={isLoggedIn} listings={listings} artists={artists} userProfile={userProfile}/>
        </div>
      </div>
    )
  }
}


export default Home;
