import { QRCode } from 'react-qrcode-logo';
import { Button } from './Buttons';
import { useContext, useRef, useState } from 'react';
import { ModalContext } from '../contexts/ModalContext';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/16/solid';
import clsx from 'clsx';

export function Invite({ link, copyLink }) {
  const { setModalOpen } = useContext(ModalContext);
  const [_copied, _setCopied] = useState(false);
  const copyLinkTimeoutRef = useRef();

  function handleCopyLinkClick(e) {
    e.preventDefault();
    const { copied } = copyLink();

    if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    _setCopied(copied);
    copyLinkTimeoutRef.current = setTimeout(() => {
      _setCopied(false);
    }, 4000);
  }

  const copyButtonClass = clsx([
    'shrink-0 select-none rounded-md bg-surfaceAlt3 p-1',
    { 'bg-positive': _copied },
  ]);

  return (
    <div className='bg-surface w-96 px-6 py-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText/50 shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10'>
      <h3 id='title' className='text-md font-bold text-uiText text-center mb-4'>
        Invite a participant
      </h3>
      <span id='full_description' className='hidden'>
        <p>Visit the invite link or scan the QR code to join the session.</p>
      </span>
      <div className='flex flex-col justify-center gap-y-4 mb-5 py-4 bg-surfaceAlt rounded-lg ring-1 ring-border'>
        <div className='text-center'>
          <span className='text-xs px-4 select-none text-pretty'>
            Scan the QR code to join this session.
          </span>
        </div>
        <div className='flex justify-center items-center relative overflow-hidden rounded-xl shadow-lg ring-1 ring-border mx-12'>
          {/* Hack to make the QR code bright on HDR displays: https://github.com/dtinth/superwhite */}
          <video
            className='absolute inset-0 w-full h-full'
            muted
            autoPlay
            playsInline
            onCanPlayThrough={() => (this.currentTime = 0)}
            poster='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQAAAAA3iMLMAAAAAXNSR0IArs4c6QAAAA5JREFUeNpj+P+fgRQEAP1OH+HeyHWXAAAAAElFTkSuQmCC'
            src='data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAvG1kYXQAAAAfTgEFGkdWStxcTEM/lO/FETzRQ6gD7gAA7gIAA3EYgAAAAEgoAa8iNjAkszOL+e58c//cEe//0TT//scp1n/381P/RWP/zOW4QtxorfVogeh8nQDbQAAAAwAQMCcWUTAAAAMAAAMAAAMA84AAAAAVAgHQAyu+KT35E7gAADFgAAADABLQAAAAEgIB4AiS76MTkNbgAAF3AAAPSAAAABICAeAEn8+hBOTXYAADUgAAHRAAAAPibW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAAKcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAw10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAAKcAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAACnAAAAAAABAAAAAAKFbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABdwAAAD6BVxAAAAAAAMWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABDb3JlIE1lZGlhIFZpZGVvAAAAAixtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAHsc3RibAAAARxzdHNkAAAAAAAAAAEAAAEMaHZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAQABAASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAHVodmNDAQIgAAAAsAAAAAAAPPAA/P36+gAACwOgAAEAGEABDAH//wIgAAADALAAAAMAAAMAPBXAkKEAAQAmQgEBAiAAAAMAsAAAAwAAAwA8oBQgQcCTDLYgV7kWVYC1CRAJAICiAAEACUQBwChkuNBTJAAAAApmaWVsAQAAAAATY29scm5jbHgACQAQAAkAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAALPwAACz8AAAAKHN0dHMAAAAAAAAAAwAAAAIAAAPoAAAAAQAAAAEAAAABAAAD6AAAABRzdHNzAAAAAAAAAAEAAAABAAAAEHNkdHAAAAAAIBAQGAAAAChjdHRzAAAAAAAAAAMAAAABAAAAAAAAAAEAAAfQAAAAAgAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAQAAAABAAAAJHN0c3oAAAAAAAAAAAAAAAQAAABvAAAAGQAAABYAAAAWAAAAFHN0Y28AAAAAAAAAAQAAACwAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAAJKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYwLjMuMTAw'
          ></video>
          <div className='relative z-10'>
            <QRCode
              value={link}
              bgColor='transparent'
              size='200'
              quietZone='20'
              qrStyle='fluid'
              eyeRadius={12}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        <div className='flex w-full items-center justify-center text-center text-xs px-12'>
          <span className='grow shrink truncate' title={link}>
            {link}
          </span>
          <button
            className={copyButtonClass}
            onClick={handleCopyLinkClick}
            aria-label='Copy link'
            title='Copy link'
          >
            {_copied ? (
              <CheckIcon className='size-4 text-white' />
            ) : (
              <ClipboardDocumentIcon className='size-4 text-current' />
            )}
          </button>
        </div>
      </div>
      <Button
        appearance='default'
        style='roundedText'
        fullWidth={true}
        type='submit'
        onClick={() => setModalOpen(false)}
      >
        Done
      </Button>
    </div>
  );
}
