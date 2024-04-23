import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, MoveLeftBtn, MoveRightBtn } from "./Buttons";

const Toolbar = ({
  zoomLevel,
  setZoomLevel,
  colorFill,
  setColorFill,
}: {
  zoomLevel: number;
  setZoomLevel: (arg: number) => void;
  colorFill: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  setColorFill: (arg: object) => void;
} ) => {
  
  return (
    <div className="mx-auto mb-5 mt-4 grid max-w-180 bg-white grid-cols-12 rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]">
      <UndoBtn />
      <RedoBtn />
      <ZoomOutBtn zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      <div className="flex flex-col group relative inline-block items-center justify-center xsm:flex-row">
        <span className="rounded-md border-[.5px] text-center mr-3 border-stroke bg-gray-2 px-4 py-0.5 text-base font-medium text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white 2xl:ml-4">
        {zoomLevel}
        </span>
      </div>
      <ZoomInBtn zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      <ColorFillBtn color={colorFill} setColor={setColorFill}/>
      <BorderColorBtn />
      <TextColorBtn />
      <MoveUpBtn />
      <MoveDownBtn />
      <MoveLeftBtn />
      <MoveRightBtn />
    </div>
  );
};

export default Toolbar;
