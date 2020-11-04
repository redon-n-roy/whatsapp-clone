import './App.css';
import Chat from './Chat';
import Sidebar from './Sidebar';
import { BrowserRouter as Router, Switch, Route} from "react-router-dom";
import SimpleReactLightbox from "simple-react-lightbox"
import Login from './Login';
import { useStateValue } from './StateProvider';

function App() {

  const [{ user }, dispatch] = useStateValue();

  return (
    <div className="app">

      {!user ? (
        <Login />
      ) : (
        <div className="app__body">
        <Router>
          <Sidebar />
          <Switch>
            <Route path="/rooms/:roomId">
              <SimpleReactLightbox>
                <Chat />
              </SimpleReactLightbox>
            </Route>
            <Route path="/">
            </Route>
          </Switch>
        </Router>
      </div>
      )}
    </div>
  );
}

export default App;
