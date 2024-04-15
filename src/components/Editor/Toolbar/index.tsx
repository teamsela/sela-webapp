import { UndoBtn, RedoBtn, ZoomInBtn, ZoomOutBtn, ColorFillBtn, BorderColorBtn, TextColorBtn, MoveUpBtn, MoveDownBtn, MoveLeftBtn, MoveRightBtn } from "./Buttons";

const Toolbar = () => {
  return (
    <div className="mx-auto mb-5 mt-4 grid max-w-200 bg-white grid-cols-11 rounded-md border border-stroke py-2 shadow-1 dark:border-strokedark dark:bg-[#37404F]">
      <UndoBtn />
      <RedoBtn />
      <ZoomInBtn />
      <ZoomOutBtn />
      <ColorFillBtn />
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
