import BSBModal from "@/components/Modals/Footer/BSBModal";
import DiscoveryModal from "@/components/Modals/Footer/DiscoveryModal";
import ESVModal from "@/components/Modals/Footer/ESVModal";
import OHBModal from "@/components/Modals/Footer/OHBModal";
import StepBibleModal from "@/components/Modals/Footer/StepBibleModal";

export const Footer = () => {
    return (
        <footer className="pl-4 py-1 my-1 flex text-sm">
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