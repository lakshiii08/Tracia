import sys
from src.criminalNetwork.config.configuration import ConfigurationManager
from src.criminalNetwork.components.rag_pipeline import RAGPipeline
from src.criminalNetwork.utils.logger import logger
from src.criminalNetwork.utils.exception import CriminalNetworkException

STAGE_NAME = "RAG Indexing Stage"


class RAGIndexingPipeline:
    def __init__(self):
        pass

    def main(self):
        try:
            config = ConfigurationManager()
            rag_pipeline_config = config.get_rag_pipeline_config()
            rag_pipeline = RAGPipeline(config=rag_pipeline_config)
            rag_pipeline.run()
        except Exception as e:
            raise CriminalNetworkException(e, sys)


if __name__ == "__main__":
    try:
        logger.info(f">>>>>> stage {STAGE_NAME} started <<<<<<")
        obj = RAGIndexingPipeline()
        obj.main()
        logger.info(f">>>>>> stage {STAGE_NAME} completed <<<<<<\n\nx==========x")
    except Exception as e:
        logger.exception(e)
        raise e