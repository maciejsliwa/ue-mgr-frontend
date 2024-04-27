import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Button, ThemeProvider, createTheme } from '@mui/material';
import { SpotifyAuth} from 'react-spotify-auth';
import axios from 'axios';
import './App.css';

const generateEmoticons = () => {
  const emoticons = ['😊', '☹️'];
  return emoticons[Math.floor(Math.random() * emoticons.length)];
};

const Calendar = ({ days }) => {
  return (
      <div className="calendar">
        {days.map((day, index) => (
            <div key={index} className={`day ${day.isVisible ? '' : 'inactive'}`}>
              <div className="day-number">{day.number}</div>
              <div className="emoticon">{day.emoticon}</div>
            </div>
        ))}
      </div>
  );
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [dateRange, setDateRange] = useState({min: '', max: ''});
  const [token, setToken] = useState(null);
  const [recentTrack, setRecentTrack] = useState(null);

  useEffect(() => {
    const spotifyToken = localStorage.getItem('spotifyAuthToken');
    if (spotifyToken) {
      setToken(spotifyToken);
    }
  }, []);

  useEffect(() => {
    const fetchRecentlyPlayed = async () => {
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/getLast', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setRecentTrack(response.data.recently_played);
        } catch (error) {
          console.error('Error fetching recently played', error);
        }
      }
    }

    fetchRecentlyPlayed();
  }, [recentTrack, token]);

  useEffect(() => {
    const fetchDateRange = async () => {
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/getRange', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setDateRange(response.data);
        } catch (error) {
          console.error('Error fetching date range', error);
        }
      }
    };

    const generateCalendarData = () => {
      const daysInMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0
      ).getDate();

      const startDate = new Date(dateRange.min);
      const endDate = new Date(dateRange.max);

      const data = Array.from({ length: daysInMonth }, (_, index) => {
        const currentDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            index + 1
        );
        const isVisible = currentDate >= startDate && currentDate <= endDate;
        return {
          number: index + 1,
          date: currentDate,
          isVisible,
          emoticon: isVisible ? generateEmoticons() : null,
        };
      });

      setCalendarData(data);
    };

    fetchDateRange();
    generateCalendarData();
  }, [currentMonth, dateRange.max, dateRange.min, token]);


  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/uploadFiles', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('File uploaded successfully');
      } else alert('Error uploading file');
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file');
    }
  };

  return (
      <ThemeProvider theme={darkTheme}>
        <div className="App">
          <SpotifyAuth
              redirectUri='http://localhost:3000/'
              clientID='7c15d9c165cc44cca6bbb29f3d5657fe'
              scopes={['user-read-private', 'user-read-email', 'user-read-recently-played']}
              btnClassName='btn btn-success btn-block'
              btnContent='Zaloguj przez Spotify'
              onAccessToken={token => {
                setToken(token);
              }}
          />
          {recentTrack && <p>Ostatnio słuchany utwór: {recentTrack}</p>}
          <input type="file" onChange={handleFileUpload}/>
          <h1>Interaktywny Kalendarz z Emotikonami</h1>
          <div className="calendar-header">
            <Button onClick={handlePrevMonth} variant="contained">
              &lt; Poprzedni Miesiąc
            </Button>
            <h2>{format(currentMonth, 'LLLL yyyy')}</h2>
            <Button onClick={handleNextMonth} variant="contained">
              Następny Miesiąc &gt;
            </Button>
          </div>
          <Calendar days={calendarData}/>
        </div>
      </ThemeProvider>
  );
};

export default App;
