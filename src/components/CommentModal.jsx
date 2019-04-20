import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import moment from 'moment'
import Axios from 'axios'
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';


class CommentModal extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      commentValue: '',
      show: false,
      listingComments: [],
    };
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow() {
    this.setState({ show: true });
  }

  handleChange(e) {
    this.setState({ commentValue: e })
  }
  submitComment(event) {
    event.preventDefault();
    const body = {
      comment: this.state.commentValue,
      name: this.props.userProfile.name,
    }
    Axios.post(`/comments/listing/${this.props.listing.id}/${this.props.userProfile.accountId}`, body)
      .then((result) => {
        const rev = result.data.reverse()
        this.setState({
          listingComments: rev,
          commentValue: '',
        })
      })
      .catch((err) => {
        console.log(err)
      })
    console.log('submitted!')
  }




  componentDidMount() {
    Axios.get(`/comments/listing/${this.props.listing.id}/${this.props.userProfile.accountId}`)
      .then((result) => {
        const rev = result.data.reverse()
        this.setState({
          listingComments: rev
        })
      })
      .catch((err) => {
        console.log(err);
      })
  }


  render() {
    const comments = this.state.listingComments
    console.log(comments)
    return (
      <>
        <Button variant="secondary" onClick={this.handleShow} >
          See This Listing's Comments!
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.listing.title} Comments!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          {comments.map((comment, index)=>{
            return (
              <Card style={{ width: '28rem' }} key={index}>
                <Card.Body>
                  <Card.Text>
                    <span>@{comment.name} | {moment(comment.createdAt).format('MMMM Do YYYY')}</span>
                    <Alert variant='secondary'>
                      <div>{comment.comment}</div>
                    </Alert>
                  </Card.Text>
                </Card.Body>
              </Card>
            )
          })}
              </Modal.Body>
          <Modal.Footer>
              <input placeholder="Add new comment..." required={true}
                onChange={(event) => { this.handleChange(event.target.value) }} value={this.state.commentValue} />
            <Button variant="primary" onClick={(event)=>this.submitComment(event)}>Submit Comment</Button>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default CommentModal