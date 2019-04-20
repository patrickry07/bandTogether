require('dotenv').config()
const express = require('express');
const path = require('path');
const session = require('express-session');
const uuid = require('uuid/v4');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../database/index');
const { sequelize, Account, Listing, Artist, Comment, ListingComment } = require('../database/config');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
require('dotenv').config();
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;
const client = require('twilio')(accountSid, authToken);
const Axios = require('axios');

/**
 * PASSPORT SETUP
 */
passport.use(new LocalStrategy((username, password, done) => {
  Account.findOne({ where: { username: username }})
    .then((account) => {
      if (!account) {
        return done(null, false, {message: 'Unknown User'});
      }
      bcrypt.compare(password, account.password)
        .then((isValid) => {
          if (isValid) {
            return done(null, account);
          } else {
            return done(null, false, {message: 'Invalid password'});
          }
        })
    })
}))

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Account.findOne({ where: {id: id}})
    .then((account) => {
      done(null, account);
    })
    .catch((err) => {
      done(err, false);
    })
})
/**
 * END PASSPORT SETUP
 */

// Imports environment variables from the .env file
require('dotenv').config();

/**
 * EXPRESS SERVER SETUP
 */
const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
/**
 * END EXPRESS SERVER SETUP
 */


/**
 * EXPRESS-SESSION SETUP
 */
const sessionStorage = new SequelizeStore({
  db: sequelize,
});

app.use(session({
  genid: (req) => {
    return uuid()
  },
  store: sessionStorage,
  secret: 'papa watzke sucks',
  // need to change this secret in production to a rand string as an env variable
  resave: false,
  saveUninitialized: true
}));
/**
 * END EXPRESS-SESSION SETUP
 */


// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());


/**
 * GEOLOCATION ENDPOINTS
 */

app.get('/geolocation/map', (req, res) => {

  const centerOfUs =  [39.8283, -98.5795];


  const map = tomtom.L.map('map', {
    key: process.env.MAP_KEY,
    basePath: '../sdk',
    center: centerOfUs,
    zoom: 10
  });

  res.send(map);


})










/**
 * END GEOLOCATION ENDPOINTS
 */



/**
 * LISTINGS ENDPOINTS
 */

// Gets all listings
app.get('/listings', (req, res) => {
  db.getListings()
    .then((listings) => {
      res.send(listings);
  })
  .catch((err) => {
    console.error(err);
    res.send(500);
  })
});

//Gets artist info for a specific listing by listingId
app.get('/listings/contact', (req, res) => {
  const {id} = req.query;
  Listing.findOne({ where: {id}})
    .then(listing => Artist.findOne({ where: {id: listing.artistId}}))
    .then((artist) => {
      res.send(artist);
  })
  .catch(err => {
    console.error(err);
    res.sendStatus(500);
  })
});



//Creates a new listing, using the logged in user's id as the artistId for the listing
app.post('/listings', (req, res) => {
  const newListing = req.body;

  
  const address = `${req.body.address} ${req.body.city}, ${req.body.state} ${req.body.zip_code}`


  if(req.isAuthenticated()) {
    Account.findOne({ where: {id: req.user.id}})
      .then(account => account.getArtist())
      .then(artist => {
        
        Axios.get(`https://api.tomtom.com/search/2/geocode/${address}.json`, {
          params: {
            limit: 1,
            key: process.env.MAP_KEY      
          }
        })
          .then((response) => {
            newListing.latitude = response.data.results[0].position.lat;
            newListing.longitude = response.data.results[0].position.lon;
            db.makeListing(artist.id, newListing)
          })
          .then(() => {
            res.sendStatus(201);
          })
      })
      .catch(err => {
        console.error(err);
        res.sendStatus(500);
      })
  } else {
    res.sendStatus(403);
  }
});
/**
 * END LISTINGS ENDPOINTS
 */


/**
 * ARTIST ENDPOINTS
 */
//Gets all artists' info
app.get('/artist', (reg, res) => {
  db.getAllArtists()
  .then((artists) => {
    res.send(artists)
  })
  .catch(err => {
    console.error(err);
    res.send(500);
  })
});

// Gets artist info by artist's name
app.get('/artist/:artistname', (req, res) => {
  const { artistname } = req.params;
  Artist.findOne({ where: {name: artistname}})
    .then(profile => {
      res.send(profile);
    })
    .catch(err => {
      res.sendStatus(500);
    })
});

// Updates the artist info for the currently logged in account
app.patch('/artist', (req, res) => {
  const details = req.body;
  if(req.isAuthenticated()) {
    Account.findOne({ where: {id: req.user.id}})
      .then(account => {
        return account.getArtist()
      })
      .then(artist => db.updateArtistDetails(artist.id, details))
      .then(() => {
        res.sendStatus(201);
      })
      .catch(err => {
        console.error(err);
        res.send(500);
      })
  } else {
    res.sendStatus(403);
  }
});
/**
 * END ARTIST ENDPOINTS
 */

/**
 * AUTHENTICATION ENDPOINTS
 */
//Creates a new account and logs in that account
app.post('/signup', (req, res) => {
  const { password1, password2, username, email, solo, contact_email, city, name } = req.body;
  if(!password1 || !username || !email || solo === undefined || !contact_email || !city || !name){
    res.status(500).send("Please give all required information");
  } else if (password1 === password2) {
    const newAccount = {
      username,
      email,
      password: password1,
      solo,
      city,
      name,
      contact_email,
    };
    db.makeAccount(newAccount)
      .then(account => db.makeArtist(account.id, newAccount)
        .then(() => {
          req.login(account, (err) => {
            if (err) throw err;
            res.send('success')
          });
        })
      )
      .catch((error) => {
        res.status(500).send("Account already exists!");
      })
  } else {
    res.status(500).send("Passwords don't match!");
  };
});

app.patch('/artist', (req, res) => {
  const details = req.body;
  console.log(details);
  if(req.isAuthenticated()) {
    db.getAccountInformation({id: req.user.id})
      .then(account => account.getArtist())
      .then(artist => db.updateArtistDetails(artist.id, details))
      .then(() => {
        res.sendStatus(201);
      })
      .catch(err => {
        console.error(err);
        res.send(500);
      })
  } else {
    res.sendStatus(403);
  }
});

// Logs in an account (requires a username and password)
app.post('/login', passport.authenticate('local', { successRedirect: "/success", failureRedirect: "/failure" }));

// Logs out an account
app.post('/logout', (req, res) => {
  req.logout();
  res.send('success');
})

// A successful login redirects here, letting the client know that the login was successful.
app.get('/success', (req, res) => {
  res.send('Logged in!');
})

// A failed login redirects here, letting the client know that the login was unsuccessful.
app.get('/failure', (req, res) => {
  res.send('Failed to log in');
})

// Tells the client whether or not the user is currently logged in.
app.get('/checkauth', (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    const userId = req.user.id;
    Artist.findOne({where:{accountId: userId}})
      .then((artist) => {
        res.send(artist);
      })
  } else {
    res.send("false");
  }
});
//////////////////// Patrick Comments ///////////////////////////////////////////
app.post('/comments/:artistId/:accountId', (req, res)=>{
  const comment = req.body.comment;
  const name = req.body.name
  const accountId = req.params.accountId;
  const artistId = req.params.artistId;
    Comment.create({
        artist_id: artistId,
        account_id: accountId,
        name: name,
        comment: comment,
    })
    .then((result)=>{
      return Comment.findAll({
        where: {
          artist_id: artistId,
        }
      })
    .then((data) => {
      res.send(data);
    })
    })
    .catch((err)=>{
      res.send(err);
    })
});

app.get('/comments/:artistId/:accountId', (req, res)=>{
    var artistId = req.params.artistId;
    Comment.findAll({
      where: {
        artist_id: artistId,
      }
    })
    .then((data)=>{
      res.send(data);
    })
    .catch((err)=>{
      res.send(err);
    })
})

app.post('/comments/listing/:listingId/:accountId', (req, res) => {
  const comment = req.body.comment;
  const name = req.body.name
  const listingId = req.params.listingId;
  const accountId = req.params.accountId;
  ListingComment.create({
    listing_id: listingId,
    account_id: accountId,
    name: name,
    comment: comment,
  })
    .then((result) => {
      return ListingComment.findAll({
        where: {
          listing_id: listingId,
        }
      })
        .then((data) => {
          res.send(data);
        })
    })
    .catch((err) => {
      res.send(err);
    })
});

app.get('/comments/listing/:listingId/:accountId', (req, res) => {
  const comment = req.body.comment;
  const name = req.body.name
  const listingId = req.params.listingId;
  const accountId = req.params.accountId;

  ListingComment.findAll({
    where: {
      listing_id: listingId,
    }
  })
  .then((data) => {
    res.send(data);
    })
  .catch((err) => {
    res.send(err);
  })
});



/**
 * END AUTHENTICATION ENDPOINTS
 */

//MESSAGES SET UP
app.post('/to',(req,res)=>{
  const artistNum = req.body.artistNum;
  const postTitle = req.body.postTitle;
  const clientName = req.body.clientName;
const clientNum = req.body.clientNum;
  client.messages
    .create({
       body: `A user has showed interest in your post on bandTogether for ${postTitle} , please contact ${clientName} at ${clientNum} asap!`,
       from: '+14044713243',
       to: `+1${artistNum}`
     })
    .then(message => console.log(message.sid));
})





//   //5129057682-arn
  //5047109310-pat


//testing messaging api
// app.get('/test',(req,res)=>{
//   client.messages
//   .create({
//     body: 'HEllo its working',
//     from: '+14044713243',
//     to: '+6785926777'
//   })
//   .then((err) => console.log(err));
// });

/**
 * SERVER INITIALIZATION
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});