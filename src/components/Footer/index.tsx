import BSBModal from "./BSBModal";
import DiscoveryModal from "./DiscoveryModal";
import ESVModal from "./ESVModal";
import OHBModal from "./OHBModal";
import StepBibleModal from "./StepBibleModal";

export const FooterComponent = () => {
    return (
        <footer className="pl-5 py-2 flex text-sm">
          <div>
            Copyright Information for&nbsp;
          </div>
        <DiscoveryModal/>,&nbsp;
        <StepBibleModal/>,&nbsp;
        <BSBModal/>,&nbsp;
        <ESVModal/>,&nbsp;
        <OHBModal/>
        </footer>
    )
}