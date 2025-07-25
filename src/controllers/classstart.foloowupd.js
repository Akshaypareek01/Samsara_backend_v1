
// Start btn click adn call handelMeetingsatrt btn 
const handelMeetingStart=async(Data,id)=>{
    console.log("Meeting start =>",id)
    handleOuthAccessToken().then((res)=>{
      console.log("Token in fun ==>",res)
      setZoomToken(res)
      createZoomMeeting(res,Data,id);
    })
  }

  const handleOuthAccessToken = async () => {
    // Extract the authorization code from the URL query parameters
    // const urlParams = new URLSearchParams(window.location.search);
    // const code = urlParams.get('code');
    //  console.log("Code ===> " + code)
    // if (code) {
      try {
        // Make a request to your backend to exchange the authorization code for an access token
        const tokenResponse = await axios.get(`${Base_url}api/zoom/zoom/oauth-token`);
        if (tokenResponse.data.access_token) {
          const token = tokenResponse.data.access_token
            setOauthUserToken(tokenResponse.data.access_token);
            
              fetchZoomTokenServerOauth(tokenResponse.data.access_token);
             return token
           
        } else {
          console.error('Failed to fetch Zoom token:', tokenResponse.data.error);
        }
      } catch (error) {
        console.error('Error exchanging code for token:', error);
      }
    // } else {
    //   console.error('Authorization code not found in URL parameters.');
    // }
  };

  const fetchZoomTokenServerOauth = async (token) => {
    try {
      // Replace 'YOUR_NODE_API_URL' with the actual URL where your Node.js API is running
      const apiUrl = `${Base_url}api/zoom/fetchZoomToken`;
        console.log('Token',OauthuserToken)
      // Make the API request
      const response = await axios.post(apiUrl, {
        AccessTokenMain: token,
      });
        
      // Parse and set the Zoom token
      setUserToken(response.data.token);
    } catch (error) {
      // Handle errors
      console.error('Error fetching Zoom token:', error);
    } finally {
      // Set loading state to false
      setLoading(false);
    }
  };

  const createZoomMeeting = async (OauthToken,Data) => {
    try {
        
        const data = {
            token: OauthToken,
            data: Data
          };
      const response = await fetch(`${Base_url}api/zoom/createZoomMeeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        const data = await response.json();
        setMeetingNumber(data.meetingNumber);
        setMeetingPassword(data.password);
        handleCreateMeeting(data.meetingNumber,data.password)
        const MeetingData ={
         number:data.meetingNumber,
         pass:data.password
        }
        setupdate((prev)=>prev+1)
        // setZoomMeetingNumber(MeetingData);
        console.log('Meeting Number:', data.meetingNumber);
      } else {
        console.error('Failed to create meeting:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error creating meeting:', error.message);
    }
  };

  const handleCreateMeeting = async (id,pass) => {
    const meetingData = {
      meetingName: 'Example Meeting',
      title: 'Meeting Title',
      duration: 60,
      meetingId: id,
      meetingPassword: pass,
      hostName: 'Admin User',
      teacherName: 'Teacher Name',
    };
  
    try {
      const response = await axios.post(`${Base_url}api/meeting`, meetingData);
  
      if (response.status === 201) {
        // Meeting created successfully
        console.log('Meeting created successfully');
        setupdate((prev)=>prev+1)
      } else {
        // Handle error
        console.error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };



  // Join Zoom Meeting
  const handelJoinZoomMeeting = (Data)=>{
    
    const data =Data
    console.log("Data===>",data)
    const ZoomMeetingNumber={
    number:data.meeting_number,
    pass:data.password,
    userToken:userToken
    }
    navigate(`zoom-cdn/`, { state: { ZoomMeetingNumber } });
  }

  // End Zoom Meeting
  const handelZoomMeetingEnd=async(id)=>{
    console.log("delete Meeting",OauthuserToken,"Id===============>",meetingNumberMain)
    const data = {
      token: OauthuserToken,
      meetingId:meetingNumberMain
    };
    try {
      const res = await axios.post(`${Base_url}api/classes/end_meeting/${id}`,data, {
        // headers: { "Authorization": `${token}` }
      });
      console.log("res Customer delete === ==>", res);
      if(res){ 
        alert("Meeting Ended successfully")
        setupdate((prev)=>prev+1)
      }
    
    } catch (err) {
      console.log("error in Customer delete", err);
    }
  }

  // Delete Class
  const handelDeleteClass=async(id)=>{
    console.log("delete Customer",id)
   
    try {
      const res = await axios.delete(`${Base_url}api/classes/${id}`, {
        // headers: { "Authorization": `${token}` }
      });
      console.log("res Customer delete === ==>", res);
      setupdate((prev)=>prev+1)
    } catch (err) {
      console.log("error in Customer delete", err);
    }
  }
 