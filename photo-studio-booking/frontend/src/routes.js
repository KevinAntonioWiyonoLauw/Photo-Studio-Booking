import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Booking from './components/Booking';

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/booking" component={Booking} />
                <Route path="/" exact component={Login} />
            </Switch>
        </Router>
    );
};

export default Routes;