import BSBModal from "@/components/Modals/Footer/BSBModal";
import DiscoveryModal from "@/components/Modals/Footer/DiscoveryModal";
import ESVModal from "@/components/Modals/Footer/ESVModal";
import OHBModal from "@/components/Modals/Footer/OHBModal";
import StepBibleModal from "@/components/Modals/Footer/StepBibleModal";

export const FooterComponent = () => {
    return (
        <footer className="flex flex-wrap items-center gap-x-1 gap-y-1 px-5 py-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Copyright Information for</span>
          <DiscoveryModal triggerClassName="px-0 hover:underline" />
          <span>,</span>
          <StepBibleModal triggerClassName="px-0 hover:underline" />
          <span>,</span>
          <BSBModal triggerClassName="px-0 hover:underline" />
          <span>,</span>
          <ESVModal triggerClassName="px-0 hover:underline" />
          <span>,</span>
          <OHBModal triggerClassName="px-0 hover:underline" />
        </footer>
    )
}
