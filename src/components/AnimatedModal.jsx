import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';
import './AnimatedModal.css';

export function AnimatedModal({ isOpen, onRequestClose, children }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={true}
      aria={{
        labelledby: 'title',
        describedby: 'full_description',
      }}
      contentElement={(props, children) => (
        <motion.div
          initial='hidden'
          animate='visible'
          variants={scaleMotionVariants}
          transition={scaleMotionTransitions}
          key='modal-motion'
          {...props}
        >
          {children}
        </motion.div>
      )}
      defaultStyles={{}}
      overlayClassName='fixed inset-0 bg-overlay/80 backdrop-blur grid place-items-center transition will-change-transform'
      contentLabel='Settings modal'
      closeTimeoutMS={150}
    >
      {children}
    </Modal>
  );
}
