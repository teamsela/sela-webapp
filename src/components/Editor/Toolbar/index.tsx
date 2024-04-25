import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, MoveLeftBtn, MoveRightBtn } from "./Buttons";

const Toolbar = ({
  zoomLevel,
  setZoomLevel,
  colorPanelActive, 
  setColorPanelActive,
  colorFill,
  setColorFill,
}: {
  zoomLevel: number;
  setZoomLevel: (arg: number) => void;
  colorPanelActive: boolean, 
  setColorPanelActive: (arg: object) => void,
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  setColorFill: (arg: object) => void;
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

      <div style={{position:"absolute",bottom:"-100%",left:"30%", padding:"0.25rem 0.75rem", background:"white",borderRadius:"0.5rem"}}>
        <button>Clear All</button>
      </div>
    </div>
  );
};

export default Toolbar;
