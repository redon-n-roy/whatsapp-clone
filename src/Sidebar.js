import React, { useEffect, useState } from 'react'
import './Sidebar.css'
import DonutLargeIcon from '@material-ui/icons/DonutLarge'
import ChatIcon from '@material-ui/icons/Chat'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import { Avatar, IconButton } from '@material-ui/core'
import { SearchOutlined } from '@material-ui/icons'
import SidebarChat from './SidebarChat'
import db from './firebase'
import { useStateValue } from './StateProvider'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import {auth} from './firebase'
import { useHistory } from 'react-router-dom'

function Sidebar() {

    const [rooms,setRooms] = useState([]);
    const [{ user }, dispatch] = useStateValue();
    const [sbAnchorEl, setSbAnchorEl] = useState(null);
    const history = useHistory();

    const handleSbClick = (event) => {
        setSbAnchorEl(event.currentTarget);
    };

    const handleSbClose = () => {
        setSbAnchorEl(null);
    };

    const handleLogout = async() => {
        await auth.signOut().then(function() {
            window.alert("Signed out successfully !")
          }).catch(function(error) {
            window.alert("Error occured: " + error)
          });
        await history.push("/");
        window.location.reload(true);
    };

    useEffect(() => {
        const unsubscribe = db.collection('rooms').orderBy('timestamp','desc').onSnapshot(snapshot => (
            setRooms(snapshot.docs.map(doc => 
            ({
                id: doc.id,
                data: doc.data()
            })))
        ));

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <div className="sidebar">
            <div className="sidebar__header">
                <Avatar src={user?.photoURL} />
                <div class="sidebar__headerRight">
                    <IconButton>
                        <DonutLargeIcon />
                    </IconButton>
                    <IconButton>
                        <ChatIcon />
                    </IconButton>
                    <IconButton aria-label="more" aria-controls="simple-menu" aria-haspopup="true" onClick={handleSbClick}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="simple-menu"
                        anchorEl={sbAnchorEl}
                        keepMounted
                        open={Boolean(sbAnchorEl)}
                        onClose={handleSbClose}
                    >
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </div>
            </div>

            <div className="sidebar__search">
                <div className="sidebar__searchContainer">
                    <SearchOutlined />
                    <input placeholder="Search or start new chat" type="text" />
                </div>
            </div>

            <div className="sidebar__chats">
                <SidebarChat addNewChat />
                {rooms.map(room => (
                    <SidebarChat key={room.id} id={room.id} data={room.data} />
                ))}
            </div>
        </div>
    )
}

export default Sidebar
