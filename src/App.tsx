import styles from "./App.module.css";
import List from "./components/List";
import InputWithLabel from "./components/InputWithLabel";
import logo from "./assets/logo.png";
import usePersistence from "./hooks/usePersistence";
import { CircularProgress, Pagination } from "@mui/material";
import React, {
  useEffect,
  useMemo,
  useReducer,
  useCallback,
  createContext,
  useState,
} from "react";
import axios from "axios";
import { useDebounce } from "./hooks/useDebounce";
import { StateType, StoryType, ActionType } from "./types";
import { Link, Navigate } from "react-router-dom";
import { color } from "@mui/system";





export const title: string = "React Training";

export function storiesReducer(state: StateType, action: ActionType) {
  switch (action.type) {
    case "SET_STORIES":
      return { data: action.payload.data, isError: false, isLoading: false };
    case "INIT_FETCH":
      return { ...state, isLoading: true, isError: false };
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, isError: true };
    case "REMOVE_STORY":
      const filteredState = state.data.filter(
        (story: any) => story.objectID !== action.payload.id
      );
      return { data: filteredState, isError: false, isLoading: false };
    default:
      return state;
  }
}

const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query=";

interface AppContextType {
  onClickDelete: (e: number) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

function App(): JSX.Element {
  const [searchText, setSearchText] = usePersistence("searchTerm", "React");
  const [CurrentPageNo,setCurrentPageNo] = useState(1);
  const debouncedUrl = useDebounce(API_ENDPOINT + searchText + "page="+CurrentPageNo);
  const [Click,setClick] = useState(false);

  const [stories, dispatchStories] = useReducer(storiesReducer, {
    data: [],
    isError: false,
    isLoading: false,
  });


  const sumOfComments = useMemo(
    () =>
      stories.data.reduce(
        (acc: number, current: StoryType) => acc + current.num_comments,
        0
      ),
    [stories]
  );

 const handlePaginationClick= (event:any,value:any)=> {
    setCurrentPageNo(value);
  }

  const handleFetchStories = useCallback(async () => {
    dispatchStories({ type: "INIT_FETCH" });
    try {
      const response = await axios.get(debouncedUrl);
      dispatchStories({
        type: "SET_STORIES",
        payload: { data: response.data.hits },
      });
    } catch {
      dispatchStories({ type: "FETCH_FAILURE" });
    }
  }, [debouncedUrl]);

  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(event.target.value);
  }

  const handleDeleteClick = useCallback((objectId: number) => {
    console.log("Delete click captured", objectId);
    dispatchStories({ type: "REMOVE_STORY", payload: { id: objectId } });
  }, []);

  if (stories.isError) {
    return (
      <h1 style={{ marginTop: "10rem", color: " red" }}>
        Something went wrong
      </h1>
    );
  }

 
 if(Click) {
  
      return (
       <div>
         <pre>{JSON.stringify(stories.data, null, 2)}</pre>
         </div>
    
      )
 }
else {
     return (
    <div>
      <nav>
        <div className={styles.heading}>
          <h1 className={styles.h1} onClick={()=> setClick(true)}>{title}</h1>
          <img src={logo} />
        </div>
        <p>Sum: {sumOfComments}</p>
        <InputWithLabel
          searchText={searchText}
          onChange={handleChange}
          id="searchBox"
        >
          Search
        </InputWithLabel>
        <Link to="/login" state={{ id: "1234" }}>
          <h6>Login</h6>
        </Link>
      </nav>
      {stories.isLoading ? (
        <h1 style={{ marginTop: "10rem" }}>Loading <CircularProgress /></h1>
      ) : (
        <AppContext.Provider value={{ onClickDelete: handleDeleteClick }}> 
            <List listOfItems={stories.data} />
        </AppContext.Provider>
      )}
       <Pagination sx={{display:"flex",justifyContent:"center",background:"transparent",margin:0,padding:0.5}} count={10} variant="outlined" color="primary" hideNextButton={true} hidePrevButton={true} onChange={handlePaginationClick} page={CurrentPageNo}  />
    </div>
    
  );
}
}



export default App;
