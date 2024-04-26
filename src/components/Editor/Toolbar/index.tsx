import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, MoveLeftBtn, MoveRightBtn } from "./Buttons";
import { useState, useEffect } from "react";

const Toolbar = ({
  zoomLevel,
  setZoomLevel,
  selectedWords,
  setSelectedWords,
  //color functions
  colorPanelActive, 
  setColorPanelActive,
  colorFill,
  setColorFill,
}: {
  zoomLevel: number;
  setZoomLevel: (arg: number) => void;
  selectedWords: number[];
  setSelectedWords: (arg: []) => void;
  //color functions
  colorPanelActive: boolean, 
  setColorPanelActive: (arg: boolean) => void,
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  setColorFill: (arg: {
    r: number;
    g: number;
    b: number;
    a: number;
  }) => void;
  //TBD: border color, text color...
} ) => {
  
  //2024-04-24 plan:
  //add a useState for each colour button (fill, border, text) to determine whether those pickers are clicked & active here
  //pass the set state function to each colour button component
  //when clicked, their state will be fliped
  //if one become active, deactivate all others

  //for setColorPanelActive: dont pass the function to each colour button component
  //if at least one useState for colour button is active, set colorPanelActive as positive
  //if not, set to negative
  // - setColorPanelActive is used by Passage/index.tsx to determine whether it should apply the new colour to word boxes

  const clearSelection = () => {
    setSelectedWords([]);
  }
  console.log("rerender")

  const [allowClearAll, setAllowClearAll] = useState(false);

  useEffect(() => {
    if(selectedWords.length > 0){
      setAllowClearAll(true);
    }
    else{
      setAllowClearAll(false);
    }
  },[selectedWords]);

  return (
    <div className="mx-auto mb-5 mt-4 grid max-w-180 bg-white grid-cols-12 rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]" style={{position:"relative"}}>
      <UndoBtn />
      <RedoBtn />
      <ZoomOutBtn zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
        <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
        {zoomLevel}
        </span>
      </div>
      <ZoomInBtn zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      <ColorFillBtn color={colorFill} setColor={setColorFill} colorPanelActive={colorPanelActive} setColorPanelActive={setColorPanelActive}/>
      <BorderColorBtn />
      <TextColorBtn />
      <MoveUpBtn />
      <MoveDownBtn />
      <MoveLeftBtn />
      <MoveRightBtn />

      <div 
      //need debug, Toolbar not re-rendering to reflect this
        className={ allowClearAll ? "absolute -bottom-12 left-55 px-2 py-1 bg-white rounded-sm" : "hidden"}
      >
        <button onClick={clearSelection}>Clear All</button>
      </div>
    </div>
  );
};


export default Toolbar;
