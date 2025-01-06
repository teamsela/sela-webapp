import BSBModal from "./BSBModal";
import DiscoveryModal from "./DiscoveryModal";
import ESVModal from "./ESVModal";
import OHBModal from "./OHBModal";

export const FooterComponent = () => {
    return (
        <footer className="pl-5 py-2 flex">
          <div>
            Copyright Information for&nbsp;
          </div>
        <DiscoveryModal/>,&nbsp;
        <BSBModal/>,&nbsp;
        <ESVModal/>,&nbsp;
        <OHBModal/>,&nbsp;
        <BSBModal/>
        </footer>
    )
}