'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface DisclaimerProps {
  onClose: () => void
}

export default function Disclaimer({ onClose }: DisclaimerProps) {
  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-warning-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-warning-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>

                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Important Disclaimer
                    </Dialog.Title>

                    <div className="mt-4 text-sm text-gray-500 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Age Restriction</h4>
                        <p>This service is intended for individuals aged 18 and over only.</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Not Financial Advice</h4>
                        <p>
                          The signals and information provided are for educational and informational 
                          purposes only and do not constitute financial advice, investment advice, 
                          trading advice, or any other type of advice.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Risk Warning</h4>
                        <p>
                          Trading involves substantial risk of loss and is not suitable for all investors. 
                          Past performance is not indicative of future results. You should carefully 
                          consider whether trading is suitable for you in light of your circumstances, 
                          knowledge, and financial resources.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">No Guarantee</h4>
                        <p>
                          We do not guarantee any specific results or outcomes. All trading involves 
                          risk, and you may lose some or all of your invested capital.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Legal Compliance</h4>
                        <p>
                          Please ensure that trading is legal in your jurisdiction and that you 
                          comply with all applicable laws and regulations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary w-full sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    I Understand
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full mt-3 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
