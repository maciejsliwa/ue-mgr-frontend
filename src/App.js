import React, {useState, useEffect} from 'react';
import {format, addMonths, subMonths, formatISO, startOfMonth, parseISO} from 'date-fns';
import {Button, ThemeProvider, createTheme} from '@mui/material';
import {SpotifyAuth} from 'react-spotify-auth';
import axios from 'axios';
import './App.css';


// Demo data
const demoData = {
    sentiments: ['positive', 'negative', 'neutral'],
    tracks: [
        {title: 'Track 1', artist: 'Artist 1', image_url: 'URL 1'},
        {title: 'Track 2', artist: 'Artist 2', image_url: 'URL 2'},
        {title: 'Track 3', artist: 'Artist 3', image_url: 'URL 3'},
    ],
};

const getEmoticon = (sentiment) => {
    switch (sentiment) {
        case 'positive':
            return '😊';
        case 'negative':
            return '☹️';
        case 'neutral':
            return '😐';
        default:
            return '❌';
    }
};

const Day = ({day, onClick}) => (
    <div onClick={() => onClick(day.date)} key={day.number} className={`day ${day.isVisible ? '' : 'inactive'}`}>
        <div className="day-number">{day.number}</div>
        <div className="emoticon">{day.emoticon}</div>
    </div>
);

const Calendar = ({days, onDayClick}) => (
    <div className="calendar dashed-border">
        {days.map((day) => <Day key={day.number} day={day} onClick={onDayClick}/>)}
    </div>
);

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
    const [sentiments, setSentiments] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);


    useEffect(() => {
        const fetchSentiments = async () => {
            if (token) {
                try {
                    const response = await axios.get(
                        `http://127.0.0.1:8000/getSentimentByMonth?month=${encodeURIComponent(formatISO(startOfMonth(currentMonth)))}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    setSentiments(response.data);
                } catch (error) {
                    console.error('Error fetching sentiments', error);
                }
            }
        };

        fetchSentiments();
    }, [currentMonth, token]);


    useEffect(() => {
        const spotifyToken = localStorage.getItem('spotifyAuthToken');
        if (spotifyToken) {
            setToken(spotifyToken);
        }
    }, []);

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
                    setCurrentMonth(new Date(response.data.max));
                } catch (error) {
                    console.error('Error fetching date range', error);
                }
            }
        };

        fetchDateRange();
    }, [token]);

    useEffect(() => {
        const generateCalendarData = () => {
            const daysInMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                0
            ).getDate();

            const startDate = new Date(dateRange.min);
            const endDate = new Date(dateRange.max);

            const data = Array.from({length: daysInMonth}, (_, index) => {
                const currentDate = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    index + 1
                );
                const isVisible = currentDate >= startDate && currentDate <= endDate;
                const sentimentEntry = sentiments.find(entry => parseISO(entry.date).getDate() === currentDate.getDate());
                const dominantSentiment = sentimentEntry ? getDominantSentiment(sentimentEntry) : null;
                return {
                    number: index + 1,
                    date: currentDate,
                    isVisible,
                    emoticon: isVisible ? getEmoticon(dominantSentiment) : null,
                };
            });

            setCalendarData(data);
        };

        generateCalendarData();
    }, [currentMonth, dateRange.max, dateRange.min, sentiments, token]);


    const loadDemoData = () => {
        const daysInCurrentMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
        ).getDate();

        const sentimentEntries = Array.from({length: daysInCurrentMonth}, (_, index) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);

            // Generate random sentiment values that add up to 1
            const randomPositive = Math.random();
            const randomNeutral = Math.random() * (1 - randomPositive);
            const randomNegative = 1 - randomPositive - randomNeutral;

            return {
                date: formatISO(date),
                positive: randomPositive,
                neutral: randomNeutral,
                negative: randomNegative,
            };
        });
        setDateRange({min: formatISO(new Date(2000, 1, 1)), max: formatISO(new Date(2025, 12, 31))});
        setSentiments(sentimentEntries);
        setTracks(demoData.tracks);
    };



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

    const handleDayClick = async (date) => {
        setSelectedDay(date);
        if (token) {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/getTracksByDay?day=${encodeURIComponent(formatISO(date))}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setTracks(response.data);
            } catch (error) {
                console.error('Error fetching playlist by day', error);
            }
        }
    };

    const getDominantSentiment = (sentiments) => {
        const {date, ...sentimentValues} = sentiments;
        const values = Object.values(sentimentValues);
        const maxSentimentValue = Math.max(...values);

        for (let sentiment in sentimentValues) {
            if (sentimentValues[sentiment] === maxSentimentValue) {
                return sentiment;
            }
        }

        return null;
    };

    const Playlist = ({day}) => {
        const [playlistId, setPlaylistId] = useState(null);

        useEffect(() => {
            const fetchPlaylist = async () => {
                if (token) {
                    try {
                        const response = await axios.get(
                            `http://127.0.0.1:8000/getPlaylistByDay?day=${encodeURIComponent(formatISO(day))}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );
                        setPlaylistId(response.data.playlist_id);
                    } catch (error) {
                        console.error('Error fetching playlist by day', error);
                    }
                }
            };

            fetchPlaylist();
        }, [day, token]);

        return (
            <div className="dashed-border btn-block">
                <iframe
                        title="Daily Sentiment Playlist"
                        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=2`}
                        width="100%"
                        height="100%"
                        style={{ minHeight: '360px' }}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="eager"
                />
            </div>
        );
    };


    return (
        <ThemeProvider theme={darkTheme}>
            <div className="App dashed-border">
                <div className="authVariant dashed-border">
                    <SpotifyAuth
                        redirectUri='http://localhost:3000/'
                        clientID={process.env.REACT_APP_SPOTIFY_CLIENT_ID}
                        scopes={['user-read-private', 'user-read-email', 'user-read-recently-played', 'playlist-modify-public', 'playlist-modify-private', 'playlist-read-private', 'playlist-read-collaborative']}
                        btnClassName='btn btn-success btn-block'
                        btnContent='Zaloguj przez Spotify'
                        onAccessToken={token => {
                            setToken(token);
                        }}
                    />
                    <Button variant="contained" onClick={loadDemoData} className='btn btn-success btn-block dashed-border'>
                    DEMO
                    </Button>
                </div>
                <input type="file" onChange={handleFileUpload}/>
                <h1>Interaktywny Kalendarz Muzycznych Emo(c)ji</h1>
                <div className="calendar-header dashed-border">
                    <Button onClick={handlePrevMonth} variant="contained">
                        &lt; Poprzedni Miesiąc
                    </Button>
                    <h2>{format(currentMonth, 'LLLL yyyy')}</h2>
                    <Button onClick={handleNextMonth} variant="contained">
                        Następny Miesiąc &gt;
                    </Button>
                </div>
                <Calendar days={calendarData} onDayClick={handleDayClick}/>
                {selectedDay && <Playlist day={selectedDay}/>}
            </div>
        </ThemeProvider>
    );
};

export default App;
