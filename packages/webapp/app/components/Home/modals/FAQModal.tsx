import React from "react";
import Modal from "../../Modal";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-3xl mb-2 minnie-title">Frequently Asked Questions</h3>
      <div className="space-y-8 pt-2">
        <div className="faq-container">
          <div className="faq-question">
            How does ToonScout get my toon's information?
          </div>
          <div className="faq-answer">
            ToonScout uses Toontown Rewritten's Companion App API, which is
            public for developers. You can find the documentation{" "}
            <a
              href="https://github.com/ToontownRewritten/api-doc/blob/master/local.md"
              className="text-blue-400 hover:underline"
            >
              here
            </a>
            .
          </div>
        </div>

        <div className="faq-container">
          <div className="faq-question">Is ToonScout open source?</div>
          <div className="faq-answer">
            Yes! The source code can be found{" "}
            <a
              href="https://github.com/erin-miller/ToonScout"
              className="text-blue-400 hover:underline"
            >
              here
            </a>
            .
          </div>
        </div>

        <div className="faq-container">
          <div className="faq-question">
            What logic is used to calculate my suit promotion, fish percentages,
            and so on?
          </div>
          <div className="faq-answer">
            All of the complex calculations in ToonScout are done by the{" "}
            <a
              href="https://github.com/erin-miller/ToonAPI-Calculator"
              className="text-blue-400 hover:underline"
            >
              Toon API Calculator
            </a>
            .
          </div>
        </div>

        <div className="faq-container">
          <div className="faq-question">
            Why am I getting so many short steel factories and no long steel
            factories in my promotion recommendation?
          </div>
          <div className="faq-answer">
            The Toon API Calculator currently ranks all facilities by time per
            total facility points (merits, cogbucks, etc). This calculation
            results in the algorithm ignoring long steel factories since it
            believes that short steels are a more efficient use of your time. In
            the future, I plan to add the option to switch between the current
            algorithm and one that will recommend skipped facilities like long
            steel factories.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FAQModal;
