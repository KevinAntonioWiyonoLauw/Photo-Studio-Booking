import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Booking from './components/Booking';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/booking" component={Booking} />
        <Route path="/" exact>
          <h1>Welcome to the Photo Studio Booking Application</h1>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;