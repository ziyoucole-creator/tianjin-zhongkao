# Copyright 2020 The HuggingFace Datasets Authors and the current dataset script contributor.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
import datasets


_CITATION = """\
@misc{liu2023m3ke,
    title={M3KE: A Massive Multi-Level Multi-Subject Knowledge Evaluation Benchmark for Chinese Large Language Models},
    author={Chuang Liu and Renren Jin and Yuqi Ren and Linhao Yu and Tianyu Dong and Xiaohan Peng and Shuting Zhang and Jianxiang Peng and Peiyi Zhang and Qingqing Lyu and Xiaowen Su and Qun Liu and Deyi Xiong},
    year={2023},
    eprint={2305.10263},
    archivePrefix={arXiv},
    primaryClass={cs.CL}
}
"""


_DESCRIPTION = """\
A Massive Multi-Level Multi-Subject Knowledge Evaluation Benchmark for Chinese Large Language Models.
"""

_HOMEPAGE = "https://github.com/tjunlp-lab/M3KE"

_LICENSE = "MIT"

_URL = "https://github.com/tjunlp-lab/M3KE/raw/main/data/M3KE.zip"


task_name_list = [
    "Advanced Mathematics-Natural Sciences-College",
    "Ancient Chinese Language-Other-Other",
    "Animal Physiology-Natural Sciences-College",
    "Anthropotomy-Natural Sciences-College",
    "Basic Principle of Marxism-Social Sciences-College",
    "Biochemistry and Pathology-Natural Sciences-College",
    "Biochemistry-Natural Sciences-College",
    "Biology-Natural Sciences-High school",
    "Biology-Natural Sciences-Junior high school",
    "Chemistry-Natural Sciences-High school",
    "Chemistry-Natural Sciences-Junior high school",
    "Chinese Civil Service Examination-Other-Other",
    "Chinese Constitutional Law-Social Sciences-College",
    "Chinese Medicine-Other-Other",
    "Chinese-Arts & Humanities-High school",
    "Chinese-Arts & Humanities-Junior high school",
    "Chinese-Arts & Humanities-Primary school",
    "Civil Law-Social Sciences-College",
    "Computer Fundamentals-Natural Sciences-Other",
    "Computer Networks-Natural Sciences-College",
    "Computer Programming Language-Natural Sciences-Other",
    "Criminal Jurisprudence-Social Sciences-College",
    "Current Affairs and Politics-Social Sciences-College",
    "Dance-Arts & Humanities-Other",
    "Data Structures-Natural Sciences-College",
    "Developmental and Educational Psychology-Social Sciences-College",
    "Economics-Other-College",
    "Educational Research Methods-Social Sciences-College",
    "Experimental Psychology-Social Sciences-College",
    "Film-Arts & Humanities-Other",
    "Fine Arts-Arts & Humanities-Other",
    "Geography-Natural Sciences-High school",
    "Geography-Natural Sciences-Junior high school",
    "History Foundation-Arts & Humanities-College",
    "History of Chinese Education-Social Sciences-College",
    "History of Foreign Education-Social Sciences-College",
    "History of the Chinese Legal System-Social Sciences-College",
    "History-Arts & Humanities-High school",
    "History-Arts & Humanities-Junior high school",
    "Humanistic Medicine-Natural Sciences-College",
    "Immunology-Natural Sciences-College",
    "Internal Medicine-Natural Sciences-College",
    "Introduction to Mao Tsetung Thoughts-Social Sciences-College",
    "Introduction to Psychology-Social Sciences-College",
    "Jurisprudence-Social Sciences-College",
    "Linear Algebra-Natural Sciences-College",
    "Management-Other-College",
    "Math-Natural Sciences-High school",
    "Math-Natural Sciences-Junior high school",
    "Math-Natural Sciences-Primary school",
    "Modern History-Arts & Humanities-College",
    "Modern World History-Arts & Humanities-College",
    "Moral Cultivation-Social Sciences-College",
    "Music-Arts & Humanities-Other",
    "Novels-Other-Other",
    "Operating Systems-Natural Sciences-College",
    "Outline of Chinese Modern History-Social Sciences-College",
    "Pharmacology-Natural Sciences-College",
    "Physics-Natural Sciences-High schoo",
    "Physics-Natural Sciences-Junior high school",
    "Physiology-Natural Sciences-College",
    "Politics-Social Sciences-High school",
    "Politics-Social Sciences-Junior high school",
    "Principles of Computer Composition-Natural Sciences-College",
    "Principles of Pedagogy-Social Sciences-College",
    "Probability Theory-Natural Sciences-College",
    "Psychology of Teaching-Social Sciences-College",
    "Religion-Other-Other",
    "Sociology-Social Sciences-College",
    "Stomatology-Natural Sciences-College",
    "Surgical Sciences-Natural Sciences-College",
]


class NewDataset(datasets.GeneratorBasedBuilder):
    BUILDER_CONFIGS = [
        datasets.BuilderConfig(
            name=task_name, 
            version=datasets.Version("1.0.0")
        )
        for task_name in task_name_list
    ]

    def _info(self):
        features = datasets.Features(
            {
                "id":datasets.Value("int32"),
                "question": datasets.Value("string"),
                "A": datasets.Value("string"),
                "B": datasets.Value("string"),
                "C": datasets.Value("string"),
                "D": datasets.Value("string"),
                "answer": datasets.Value("string"),
            }
        )

        return datasets.DatasetInfo(
            description=_DESCRIPTION,
            features=features,
            homepage=_HOMEPAGE,
            license=_LICENSE,
            citation=_CITATION,
        )

    def _split_generators(self, dl_manager):
        data_dir = dl_manager.download_and_extract(_URL)
        task_name = self.config.name
        return [
            datasets.SplitGenerator(
                name=datasets.Split.TEST,
                gen_kwargs={
                    "filepath": os.path.join(
                        data_dir, 
                        "test",
                        f"{task_name}.jsonl",
                    ),
                },
            ),
            datasets.SplitGenerator(
                name=datasets.Split("dev"),
                gen_kwargs={
                    "filepath": os.path.join(
                        data_dir, 
                        "dev",
                        f"{task_name}.jsonl",
                    ),
                },
            ),
        ]

    def _generate_examples(self, filepath):
        with open(filepath, mode="r", encoding="utf-8") as f:
            for line_idx, json_line in enumerate(f):
                json_data = json.loads(json_line)
                yield line_idx, json_data

