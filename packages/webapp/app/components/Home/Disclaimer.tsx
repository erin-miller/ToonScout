import React, { useState } from "react";
import PrivacyModal from "./modals/PrivacyModal";
import AboutModal from "./modals/AboutModal";
import ContactModal from "./modals/ContactModal";
import FAQModal from "./modals/FAQModal";

const Disclaimer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);
  const version = process.env.NEXT_PUBLIC_VERSION || "v0.0.0";

  return (
    <div className="disclaimer-text relative">
      <div className="absolute left-3 top-2.5 bg-blue-400 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md">
        {version}
      </div>
      <div className="absolute right-3 top-2.5">
        <a
          href="https://ko-fi.com/cozziejam"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/images/kofi_symbol.svg" alt="Ko-fi" className="h-7 w-7" />
        </a>
      </div>
      <div className="space-x-4">
        <button onClick={() => openModal("about")} className="modal-btn">
          About
        </button>
        <button onClick={() => openModal("faq")} className="modal-btn">
          FAQ
        </button>
        <button onClick={() => openModal("privacy")} className="modal-btn">
          Privacy Policy
        </button>
        <button onClick={() => openModal("contact")} className="modal-btn">
          Contact
        </button>
      </div>
      <p className="pt-1">
        This website and the Discord app are not affiliated with Toontown
        Rewritten.
      </p>

      {/* Modals */}
      {activeModal === "about" && (
        <AboutModal isOpen={true} onClose={closeModal} />
      )}
      {activeModal === "privacy" && (
        <PrivacyModal isOpen={true} onClose={closeModal} />
      )}
      {activeModal === "contact" && (
        <ContactModal isOpen={true} onClose={closeModal} />
      )}
      {activeModal === "faq" && <FAQModal isOpen={true} onClose={closeModal} />}
    </div>
  );
};

export default Disclaimer;
