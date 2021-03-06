import { Avatar } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import db from './firebase'
import './SidebarChat.css'
import { Link } from 'react-router-dom'
import { useStateValue } from './StateProvider'
import firebase from 'firebase'

function SidebarChat({id, data, addNewChat}) {

    const [messages, setMessages] = useState("");
    const [{ user }, dispatch] = useStateValue();
    useEffect(() => {
        if(id) {
            db.collection('rooms').doc(id).collection('messages')
            .orderBy('timestamp','desc').onSnapshot(snapshot => (
                setMessages(snapshot.docs.map((doc) => doc.data()))
            ));
        }
    }, []);

    const createChat = () => {
        const roomName = prompt("Please enter name for chat room");
        
        if(roomName) {
            db.collection('rooms').add({
                name: roomName,
                avatar: '',
                admin: user.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    };

    return !addNewChat ? (
        <Link to={`/rooms/${id}`}>   
            <div className="sidebarChat">
                <Avatar src={data.avatar ? data.avatar : `https://ui-avatars.com/api/?background=random&name=${data.name}`}/>
                <div className="sidebarChat__info">
                    <h2>{data.name}</h2>
                    <p>{<b>{messages[0]?.name}</b>}{messages[0] ? ' : ':''}
                    {(messages[0]?.message) ? messages[0]?.message.slice(0,20)+((messages[0]?.message.length > 20) ? '...': '') 
                    : (messages[0]?.image) ? '📷' : ''}</p>
                </div>
            </div>
        </Link>
    ): (
        <div onClick={createChat} className="sidebarChat">
            <h2>Add new chat</h2>
        </div>
    )
}

export default SidebarChat
